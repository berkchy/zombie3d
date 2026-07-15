PluginRegistry.register({
  id: 'weapon_shotgun',
  name: 'Pompali',
  version: '1.0',
  type: 'weapon',
  weaponType: 'shotgun',
  modelId: 'model_shotgun',
  description: 'Pompali tufek — 6 saçma atar, yavas ates eder',

  cooldown: 0,
  cooldownTime: 0.9,
  bullets: [],
  bulletSpeed: 500,
  pelletsPerShot: 6,
  pelletDamage: 10,
  spreadAngle: 0.07,
  clip: 6,
  ammo: 6,
  maxAmmo: 30,
  reloadTime: 0.5,
  reloadMode: 'shell',

  init(game) {
    this.game = game;
    this.bullets = [];
    this.cooldown = 0;
    this.ammo = this.clip;
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this.ammo <= 0) return;
    this.cooldown = this.cooldownTime;
    this.ammo--;

    var scene = this.game.scene;

    // Mermi cikis noktasi
    var pos = new THREE.Vector3();
    var fp = PluginRegistry.get('fx_firstperson');

    for (var p = 0; p < this.pelletsPerShot; p++) {
      // Hedef yonu
      var dir;
      if (fp && fp.enabled) {
        if (p === 0) {
          pos.copy(this.game.camera.position);
          pos.y = owner.mesh.position.y + 0.35;
          dir = new THREE.Vector3(0, 0, -1);
          dir.applyQuaternion(this.game.camera.quaternion);
          pos.add(dir.clone().multiplyScalar(0.15));
        }
        dir = new THREE.Vector3(0, 0, -1);
        dir.applyQuaternion(this.game.camera.quaternion);
      } else {
        if (p === 0) {
          if (typeof owner.getBarrelWorldPos === 'function') {
            owner.getBarrelWorldPos(pos);
          } else {
            pos.copy(owner.mesh.position).add(new THREE.Vector3(0, 0.4, 0));
          }
        }
        dir = new THREE.Vector3(0, 0, 1);
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), owner.mesh.rotation.y);
      }

      // Saçılma: yatay + dikey — crosshair etrafında dairesel
      var spreadH = (Math.random() - 0.5) * this.spreadAngle * 2;
      var spreadV = (Math.random() - 0.5) * this.spreadAngle * 2;
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadH);
      dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), spreadV);
      dir.normalize();

      var geo = new THREE.SphereGeometry(0.04, 5, 5);
      var mat = new THREE.MeshStandardMaterial({
        color: 0xccbb99,
        emissive: 0x664422,
        emissiveIntensity: 0.2
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);

      var light = new THREE.PointLight(0xff8800, 0.3, 0.6);
      light.position.copy(pos);
      scene.add(light);

      this.bullets.push({
        mesh: mesh,
        light: light,
        dir: dir,
        life: 1.5,
        damage: this.pelletDamage
      });
    }

    PluginRegistry.emit('weapon:fire', {
      weapon: this,
      position: pos,
      pellets: this.pelletsPerShot,
      ammo: this.ammo
    });
    PluginRegistry.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip });
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;

    var toRemove = [];
    var scene = this.game.scene;
    var zombiePlugin = PluginRegistry.get('zombie_basic');

    for (var i = 0; i < this.bullets.length; i++) {
      var b = this.bullets[i];
      b.life -= dt;
      if (b.life <= 0) { toRemove.push(i); continue; }

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
          if (zombiePlugin.hitTest(b.mesh.position, 0.1, b.damage)) {
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
  }
});
