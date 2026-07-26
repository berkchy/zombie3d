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
  pelletsPerShot: 6,
  pelletDamage: 10,
  knockback: 160,
  shake: 0.12,
  spreadAngle: 0.07,
  clip: 6,
  ammo: 6,
  maxAmmo: 30,
  reserve: 24,
  reloadTime: 0.5,
  reloadMode: 'shell',

  init(game) {
    loader.loadScript('model_shotgun', function(){});
    this.game = game;
    this.cooldown = 0;
    this.ammo = this.clip;
    this.reserve = this.maxAmmo - this.ammo;

    plugin.off('game:loaded', this.id + '_sounds');
    plugin.on('game:loaded', this.id + '_sounds', function() {
      if (game.sound) {
        game.sound.addSound('shotgun_fire', {
          label: 'Pompalı Ateşi', cat: 'silahlar',
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

    var dir;
    if (fp && fp.enabled) {
      pos.copy(this.game.camera.position);
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

    var bs = plugin.get('system_bullet');
    if (bs && bs.enabled) {
      bs.spawn({ position: pos, direction: dir, speed: 500, damage: this.pelletDamage, knockback: this.knockback, count: this.pelletsPerShot, spread: this.spreadAngle, life: 1.5, size: 0.05 });
    }

    if (this.game.sound) this.game.sound.playAt('shotgun_fire', this.game.camera ? this.game.camera.position : null);

    plugin.emit('weapon:fire', {
      weapon: this,
      position: pos,
      pellets: this.pelletsPerShot,
      ammo: this.ammo
    });
    plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip, reserve: this.reserve });
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
  },

  addAmmo: function(amount) {
    var old = this.reserve;
    var maxReserve = this.maxAmmo - this.ammo;
    this.reserve = Math.min(maxReserve, this.reserve + amount);
    if (this.reserve !== old) {
      plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip, reserve: this.reserve });
    }
  },

  destroy() {
    plugin.off('game:loaded', this.id + '_sounds');
    plugin.off('bullet:hit', this.id);
  }
});
