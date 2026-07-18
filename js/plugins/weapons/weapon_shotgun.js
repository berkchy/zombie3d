var plugin = include('registry');
var loader = include('loader');
// ===== weapon_shotgun =====
plugin.register({
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
    loader.loadScript('model_shotgun', function(){});
    this.game = game;
    this.bullets = [];
    this.cooldown = 0;
    this.ammo = this.clip;

    plugin.off('game:loaded', this.id + '_sounds');
    plugin.on('game:loaded', this.id + '_sounds', function() {
      if (game.sound) {
        game.sound.addSound('shotgun_fire', {
          variants: [{ src: ['audio/shotgun_fire.mp3'], volume: 0.9 }]
        });
      }
    });

    var self = this;
    plugin.on('bullet:hit', this.id, function(data) {
      if (game.sound) game.sound.playAt('bullet_hit', data ? data.position : null);
    });
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this.ammo <= 0) return;
    this.cooldown = this.cooldownTime;
    this.ammo--;

    var scene = this.game.scene;

    // Mermi cikis noktasi
    var pos = new THREE.Vector3();
    var fp = plugin.get('fx_firstperson');

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

      this.bullets.push({
        pos: pos.clone(),
        dir: dir,
        life: 1.5,
        damage: this.pelletDamage
      });
    }

    if (this.game.sound) this.game.sound.playAt('shotgun_fire', this.game.camera ? this.game.camera.position : null);

    plugin.emit('weapon:fire', {
      weapon: this,
      position: pos,
      pellets: this.pelletsPerShot,
      ammo: this.ammo
    });
    plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip });
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;

    var toRemove = [];
    var scene = this.game.scene;
    var zombiePlugin = plugin.get('zombie_basic');

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
        b.pos.x += b.dir.x * stepSize;
        b.pos.y += b.dir.y * stepSize;
        b.pos.z += b.dir.z * stepSize;
        remaining -= stepSize;

        if (zombiePlugin && zombiePlugin.enabled) {
          if (zombiePlugin.hitTest(b.pos, 0.05, b.damage)) {
            plugin.emit('bullet:hit', { position: b.pos.clone(), bullet: b });
            toRemove.push(i);
            hit = true;
            break;
          }
        }
      }

      if (hit) continue;

      var half = 28;
      if (Math.abs(b.pos.x) > half || Math.abs(b.pos.z) > half) {
        toRemove.push(i);
      }
    }

    for (var i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      this.bullets.splice(idx, 1);
    }
  },

  addAmmo: function(amount) {
    var old = this.ammo;
    this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    if (this.ammo !== old) {
      plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip });
    }
  },

  destroy() {
    this.bullets = [];
    plugin.off('bullet:hit', this.id);
  }
});
