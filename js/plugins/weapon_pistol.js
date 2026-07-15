PluginRegistry.register({
  id: 'weapon_pistol',
  name: 'Tabanca',
  version: '1.0',
  type: 'weapon',
  weaponType: 'ranged',
  modelId: 'model_pistol',
  description: 'Standart mermi silahı + weapon:fire, ammo:change',

  cooldown: 0,
  cooldownTime: 0.25,
  bullets: [],
  bulletSpeed: 15,
  damage: 25,
  ammo: 999,
  maxAmmo: 999,

  init(game) {
    this.game = game;
    this.bullets = [];
    this.cooldown = 0;
    this.ammo = this.maxAmmo;
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this.ammo <= 0) return;
    this.cooldown = this.cooldownTime;
    this.ammo--;

    var scene = this.game.scene;

    // Mermi cikis noktasi: namlu ucu
    var pos = new THREE.Vector3();
    if (owner.weaponBarrelTip) {
      owner.weaponBarrelTip.getWorldPosition(pos);
    } else {
      pos.copy(owner.mesh.position).add(new THREE.Vector3(0, 0.4, 0));
    }

    var dir = new THREE.Vector3(0, 0, 1);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), owner.mesh.rotation.y);

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
    PluginRegistry.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo });
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;

    var toRemove = [];
    var scene = this.game.scene;

    for (var i = 0; i < this.bullets.length; i++) {
      var b = this.bullets[i];
      b.life -= dt;
      if (b.life <= 0) { toRemove.push(i); continue; }

      b.mesh.position.x += b.dir.x * this.bulletSpeed * dt;
      b.mesh.position.z += b.dir.z * this.bulletSpeed * dt;
      if (b.light) {
        b.light.position.copy(b.mesh.position);
      }

      var zombiePlugin = PluginRegistry.get('zombie_basic');
      if (zombiePlugin && zombiePlugin.enabled) {
        if (zombiePlugin.hitTest(b.mesh.position, 0.1)) {
          PluginRegistry.emit('bullet:hit', { position: b.mesh.position.clone(), bullet: b });
          toRemove.push(i);
          continue;
        }
      }

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
      PluginRegistry.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo });
    }
  },

  destroy() {
    var scene = this.game.scene;
    this.bullets.forEach(function(b) {
      if (b.mesh) scene.remove(b.mesh);
      if (b.light) scene.remove(b.light);
    });
    this.bullets = [];
  }
});
