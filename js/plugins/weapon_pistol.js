PluginRegistry.register({
  id: 'weapon_pistol',
  name: 'Tabanca',
  version: '1.0',
  type: 'weapon',
  weaponType: 'pistol',
  modelId: 'model_pistol',
  description: 'Standart mermi silahı + weapon:fire, ammo:change',

  cooldown: 0,
  cooldownTime: 0.25,
  bullets: [],
  bulletSpeed: 500,
  damage: 25,
  clip: 15,
  ammo: 15,
  maxAmmo: 60,
  reloadTime: 1.5,
  _modelRef: null,
  _animId: null,

  init(game) {
    this.game = game;
    this.bullets = [];
    this.cooldown = 0;
    this.ammo = this.clip;
    this._modelRef = null;
    this._animId = null;

    var self = this;
    PluginRegistry.on('reload:start', this.id, function() {
      if (!self._modelRef) return;
      var sel = game.hotbar ? game.hotbar.getSelected() : null;
      if (sel && sel.slot && sel.slot.id === self.id) self._playAnim('reload');
    });
    PluginRegistry.on('hotbar:select', this.id, function() {
      if (self._animId) {
        var a = PluginRegistry.get('core_animation');
        if (a && a.stop) a.stop(self._animId);
        self._animId = null;
      }
    });
  },

  setModelRef: function(model) {
    this._modelRef = model;
    this._playAnim('equip');
  },

  _playAnim: function(name) {
    if (!this._modelRef) return;
    var a = PluginRegistry.get('core_animation');
    if (!a || !a.enabled) return;
    var mp = PluginRegistry.get('model_pistol');
    if (!mp || !mp.animations || !mp.animations[name]) return;
    if (this._animId && a.playing && a.playing[this._animId]) a.stop(this._animId);
    this._animId = a.play(this._modelRef, mp.animations[name]);
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this.ammo <= 0) return;
    this.cooldown = this.cooldownTime;
    this.ammo--;

    var scene = this.game.scene;

    // Mermi cikis noktasi
    var pos = new THREE.Vector3();
    var dir;
    var fp = PluginRegistry.get('fx_firstperson');
    if (fp && fp.enabled) {
      pos.copy(this.game.camera.position);
      pos.y = owner.mesh.position.y + 0.35;
      dir = new THREE.Vector3(0, 0, -1);
      dir.applyQuaternion(this.game.camera.quaternion);
      pos.add(dir.clone().multiplyScalar(0.15));
    } else {
      if (typeof owner.getBarrelWorldPos === 'function') {
        owner.getBarrelWorldPos(pos);
      } else {
        pos.copy(owner.mesh.position).add(new THREE.Vector3(0, 0.4, 0));
      }
      dir = new THREE.Vector3(0, 0, 1);
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), owner.mesh.rotation.y);
    }

    this._playAnim('fire');

    var geo = new THREE.SphereGeometry(0.08, 6, 6);
    var mat = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);

    var light = new THREE.PointLight(0xffaa00, 0.5, 1);
    light.position.copy(pos);
    scene.add(light);

    this.bullets.push({
      mesh: mesh,
      light: light,
      dir: dir,
      life: 2.0
    });

    PluginRegistry.emit('weapon:fire', {
      weapon: this,
      position: pos,
      direction: dir,
      ammo: this.ammo
    });
    PluginRegistry.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip });
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;

    var toRemove = [];
    var scene = this.game.scene;

    for (var i = 0; i < this.bullets.length; i++) {
      var b = this.bullets[i];
      b.life -= dt;
      if (b.life <= 0) { toRemove.push(i); continue; }

      var zombiePlugin = PluginRegistry.get('zombie_basic');
      var totalDist = this.bulletSpeed * dt;
      var step = 0.5;
      var remaining = totalDist;
      var hit = false;

      while (remaining > 0) {
        var stepSize = Math.min(step, remaining);
        b.mesh.position.x += b.dir.x * stepSize;
        b.mesh.position.y += b.dir.y * stepSize;
        b.mesh.position.z += b.dir.z * stepSize;
        remaining -= stepSize;

        if (b.light) b.light.position.copy(b.mesh.position);

        if (zombiePlugin && zombiePlugin.enabled) {
          if (zombiePlugin.hitTest(b.mesh.position, 0.1)) {
            PluginRegistry.emit('bullet:hit', { position: b.mesh.position.clone(), bullet: b });
            toRemove.push(i);
            hit = true;
            break;
          }
        }
      }

      if (hit) continue;

      var half = 28;
      if (Math.abs(b.mesh.position.x) > half || Math.abs(b.mesh.position.z) > half) {
        toRemove.push(i);
      }
    }

    for (var i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      var b = this.bullets[idx];
      if (b.mesh) scene.remove(b.mesh);
      if (b.light) scene.remove(b.light);
      this.bullets.splice(idx, 1);
    }
  },

  addAmmo: function(amount) {
    var old = this.ammo;
    this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    if (this.ammo !== old) {
    PluginRegistry.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip });
    }
  },

  destroy() {
    var scene = this.game.scene;
    this.bullets.forEach(function(b) {
      if (b.mesh) scene.remove(b.mesh);
      if (b.light) scene.remove(b.light);
    });
    this.bullets = [];
    this._modelRef = null;
    this._animId = null;
    PluginRegistry.off('reload:start', this.id);
    PluginRegistry.off('hotbar:select', this.id);
  }
});
