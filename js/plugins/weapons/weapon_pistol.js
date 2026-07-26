var plugin = window.include('registry');
var loader = window.include('loader');
// ===== weapon_pistol =====
plugin.register({
  id: 'weapon_pistol',
  name: 'Tabanca',
  version: '1.0',
  type: 'weapon',
  weaponType: 'pistol',
  modelId: 'model_pistol',
  description: 'Standart mermi silahı + weapon:fire, ammo:change',

  cooldown: 0,
  cooldownTime: 0.25,
  damage: 25,
  knockback: 25,
  shake: 0.045,
  clip: 15,
  ammo: 15,
  maxAmmo: 60,
  reserve: 45,
  reloadTime: 1.5,
  _equipping: false,
  _modelRef: null,
  _animId: null,
  _idleAnimId: null,
  _armsRef: null,
  _animArmId: null,
  _restPose: null,
  _armAnims: {
    fire: { duration: 0.4, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.z', keys: [0, 0.025, 0.005, 0] },
      { pivot: '__self__', prop: 'position.y', keys: [0, 0.012, -0.003, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.08, -0.01, 0] }
    ]},
    reload: { duration: 1.3, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.y', keys: [0, -0.08, -0.08, -0.03, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.06, 0.05, 0.01, 0] }
    ]},
    equip: { duration: 2.0, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.y', keys: [-0.7, -0.6, -0.4, -0.15, -0.02, 0] },
      { pivot: '__self__', prop: 'position.z', keys: [0.5, 0.4, 0.25, 0.1, 0.02, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0.7, 0.5, 0.25, 0.08, 0.01, 0] }
    ]}
  },

  init(game) {
    loader.loadScript('model_pistol', function(){});
    this.game = game;
    this.cooldown = 0;
    this.ammo = this.clip;
    this._modelRef = null;
    this._animId = null;
    this._animArmId = null;
    this._restPose = null;
    this._equipping = false;
    this.reserve = this.maxAmmo - this.ammo;

    plugin.off('game:loaded', this.id + '_sounds');
    var self = this;
    plugin.on('game:loaded', this.id + '_sounds', function() {
      if (game.sound) {
        game.sound.addSound('pistol_fire', {
          randomPlay: true, currentIndex: 0, label: 'Tabanca Ateşi', cat: 'silahlar',
          variants: [
            { src: ['audio/pistol_fire_1.mp3'], volume: 0.8 },
            { src: ['audio/pistol_fire_2.mp3'], volume: 0.8 }
          ]
        });
        game.sound.addSound('pistol_reload', {
          label: 'Tabanca Doldurma', cat: 'silahlar',
          variants: [{ src: ['audio/pistol_reload.mp3'], volume: 0.8 }]
        });
        game.sound.addSound('bullet_hit', {
          label: 'Mermi İsabet', cat: 'silahlar',
          variants: [{ src: ['audio/bullet_hit.mp3'], volume: 0.8 }]
        });
      }
    });
    plugin.on('reload:start', this.id, function(data) {
      if (!self._modelRef) return;
      if (data && data.weapon && data.weapon.id === self.id) {
        self._playAnim('reload');
        if (game.sound) game.sound.play('pistol_reload');
      }
    });
    plugin.on('bullet:hit', this.id, function(data) {
      if (game.sound) game.sound.playAt('bullet_hit', data ? data.position : null);
    });
    plugin.on('hotbar:select', this.id, function() {
      var a = plugin.get('core_animation');
      if (self._animId && a && a.stop) a.stop(self._animId);
      if (self._animArmId && a && a.stop) a.stop(self._animArmId);
      self._animId = null;
      self._animArmId = null;
      self._resetToRestPose();
      self._equipping = false;
    });
  },

  setModelRef: function(model) {
    this._modelRef = model;
    this._restPose = {
      pos: { x: model.position.x, y: model.position.y, z: model.position.z },
      rot: { x: model.rotation.x, y: model.rotation.y, z: model.rotation.z }
    };
    this._equipping = true;
    this._playAnim('equip');
  },

  setArmsRef: function(group) {
    this._armsRef = group;
  },

  _resetToRestPose: function() {
    if (!this._modelRef || !this._restPose) return;
    var rp = this._restPose;
    this._modelRef.position.set(rp.pos.x, rp.pos.y, rp.pos.z);
    this._modelRef.rotation.set(rp.rot.x, rp.rot.y, rp.rot.z);
  },

  _playAnim: function(name) {
    var a = plugin.get('core_animation');
    if (!a || !a.enabled) return;

    if (this._animId && a.playing && a.playing[this._animId]) a.stop(this._animId);
    if (this._animArmId && a.playing && a.playing[this._animArmId]) a.stop(this._animArmId);
    if (this._idleAnimId && a.playing && a.playing[this._idleAnimId]) a.stop(this._idleAnimId);
    this._animId = null;
    this._animArmId = null;
    this._idleAnimId = null;

    if (name !== 'equip') this._resetToRestPose();

    var self = this;

    if (this._modelRef) {
      var mp = plugin.get('model_pistol');
      if (mp && mp.animations && mp.animations[name]) {
        var def = mp.animations[name];
        var defCb = Object.assign({}, def, {
          onComplete: function() {
            self._resetToRestPose();
            if (name === 'equip') self._equipping = false;
            if (name !== 'idle') self._startIdle();
          }
        });
        this._animId = a.play(this._modelRef, defCb);
      }
    }
    if (this._armsRef && this._armAnims && this._armAnims[name]) {
      this._animArmId = a.play(this._armsRef, this._armAnims[name]);
    }
  },

  _startIdle: function() {
    var a = plugin.get('core_animation');
    if (!a || !a.enabled || !this._armsRef) return;
    var mp = plugin.get('model_pistol');
    if (mp && mp.animations && mp.animations.idle) {
      this._idleAnimId = a.play(this._armsRef, mp.animations.idle);
    }
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this._equipping) return;
    if (this.ammo <= 0) return;
    this.cooldown = this.cooldownTime;
    this.ammo--;

    var scene = this.game.scene;

    // Mermi cikis noktasi
    var pos = new THREE.Vector3();
    var dir;
    var fp = plugin.get('fx_firstperson');
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

    this._playAnim('fire');
    if (this.game.sound) this.game.sound.playAt('pistol_fire', this.game.camera ? this.game.camera.position : null);

    var bs = plugin.get('system_bullet');
    if (bs && bs.enabled) {
      bs.spawn({ position: pos, direction: dir, speed: 500, damage: this.damage, knockback: this.knockback, count: 1, life: 2.0, size: 0.05, spread: 0.02 });
    }

    plugin.emit('weapon:fire', {
      weapon: this,
      position: pos,
      direction: dir,
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
    var a = plugin.get('core_animation');
    if (a) {
      if (this._animId && a.playing && a.playing[this._animId]) a.stop(this._animId);
      if (this._animArmId && a.playing && a.playing[this._animArmId]) a.stop(this._animArmId);
      if (this._idleAnimId && a.playing && a.playing[this._idleAnimId]) a.stop(this._idleAnimId);
    }
    this._modelRef = null;
    this._armsRef = null;
    this._animId = null;
    this._animArmId = null;
    this._idleAnimId = null;
    this._restPose = null;
    plugin.off('game:loaded', this.id + '_sounds');
    plugin.off('reload:start', this.id);
    plugin.off('hotbar:select', this.id);
    plugin.off('bullet:hit', this.id);
  }
});
