var plugin = window.include('registry');
var loader = window.include('loader');
plugin.register({
  id: 'weapon_ump45',
  name: 'UMP45',
  version: '1.0',
  type: 'weapon',
  weaponType: 'smg',
  modelId: 'model_ump45',
  // Viewmodel kol duruşu — sağ el kabzada geride, sol el namluya doğru ileride.
  viewArmPose: {
    base: 'default',
    lSh: [-0.10, -0.05, 0.08], lEl: [-0.18, -0.04, -0.06], lHa: [-0.12, -0.04, -0.20],
    rSh: [0.08, -0.05, 0.02], rEl: [0.12, -0.06, 0.03], rHa: [0.04, -0.04, -0.07]
  },
  description: 'HK UMP45 SMG — 25 mermi, hizli ates',

  cooldown: 0,
  cooldownTime: 0.1,
  damage: 25,
  spreadAngle: 0.015,
  knockback: 20,
  knockbackDistance: 6,
  shake: 0.04,
  clip: 25,
  ammo: 25,
  maxAmmo: 100,
  reserve: 75,
  reloadTime: 1.8,
  _equipping: false,
  _modelRef: null,
  _animId: null,
  _idleAnimId: null,
  _armsRef: null,
  _animArmId: null,
  _restPose: null,
  _flashSprite: null,
  _flashTimer: 0,
  _armAnims: {
    fire: { duration: 0.15, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.z', keys: [0, 0.02, 0.004, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.05, -0.005, 0] }
    ]},
    reload: { duration: 2.0, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.y', keys: [0, -0.02, -0.06, -0.06, -0.02, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.05, 0.1, 0.08, 0.02, 0] },
      { pivot: 'right_elbow', prop: 'rotation.x', keys: [0, 0.06, 0.15, 0.12, 0.04, 0] },
      { pivot: 'right_wrist', prop: 'rotation.x', keys: [0, -0.02, -0.08, -0.06, -0.02, 0] }
    ]},
    equip: { duration: 1.2, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.y', keys: [-0.5, -0.3, -0.08, 0] },
      { pivot: '__self__', prop: 'position.z', keys: [0.35, 0.18, 0.04, 0] }
    ]}
  },

  init(game) {
    loader.loadScript('model_ump45', function(){});
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
        game.sound.addSound('ump45_fire', {
          randomPlay: true, currentIndex: 0, label: 'UMP45 Ates', cat: 'silahlar',
          variants: [
            { src: ['audio/ump45_fire_1.mp3'], volume: 0.8 },
            { src: ['audio/ump45_fire_2.mp3'], volume: 0.8 }
          ]
        });
        game.sound.addSound('ump45_reload', {
          label: 'UMP45 Doldurma', cat: 'silahlar',
          variants: [{ src: ['audio/ump45_reload.mp3'], volume: 0.8 }]
        });
      }
    });
    plugin.on('reload:start', this.id, function(data) {
      if (!self._modelRef) return;
      if (data && data.weapon && data.weapon.id === self.id) {
        self._playAnim('reload');
        if (game.sound) game.sound.play('ump45_reload');
      }
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
    this._armRestQ = {};
    var elbow = group.getObjectByName('right_elbow');
    var wrist = group.getObjectByName('right_wrist');
    if (elbow) this._armRestQ.elbow = elbow.quaternion.clone();
    if (wrist) this._armRestQ.wrist = wrist.quaternion.clone();
  },

  _resetToRestPose: function() {
    if (!this._modelRef || !this._restPose) return;
    var rp = this._restPose;
    this._modelRef.position.set(rp.pos.x, rp.pos.y, rp.pos.z);
    this._modelRef.rotation.set(rp.rot.x, rp.rot.y, rp.rot.z);
  },

  _resetArmsAnimationPose: function() {
    if (!this._armsRef) return;
    this._armsRef.position.set(0, 0, 0);
    this._armsRef.rotation.set(0, 0, 0);
    var elbow = this._armsRef.getObjectByName('right_elbow');
    var wrist = this._armsRef.getObjectByName('right_wrist');
    if (elbow && this._armRestQ && this._armRestQ.elbow) elbow.quaternion.copy(this._armRestQ.elbow);
    if (wrist && this._armRestQ && this._armRestQ.wrist) wrist.quaternion.copy(this._armRestQ.wrist);
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

    if (name !== 'equip') {
      this._resetToRestPose();
      this._resetArmsAnimationPose();
    }

    var self = this;

    if (this._modelRef) {
      var mp = plugin.get('model_ump45');
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
      var armDef = Object.assign({}, this._armAnims[name], {
        onComplete: function() { self._resetArmsAnimationPose(); }
      });
      this._animArmId = a.play(this._armsRef, armDef);
    }
  },

  _startIdle: function() {
    var a = plugin.get('core_animation');
    if (!a || !a.enabled || !this._armsRef) return;
    var mp = plugin.get('model_ump45');
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
    if (this.game.sound) this.game.sound.playAt('ump45_fire', this.game.camera ? this.game.camera.position : null);

    var bs = plugin.get('system_bullet');
    if (bs && bs.enabled) {
      bs.spawn({ position: pos, direction: dir, speed: 500, damage: this.damage, knockback: this.knockback, knockbackDistance: this.knockbackDistance, count: 1, life: 2.0, size: 0.04, spread: this.spreadAngle });
    }

    this._showMuzzleFlash();

    plugin.emit('weapon:fire', {
      weapon: this,
      position: pos,
      direction: dir,
      spread: this.spreadAngle,
      ammo: this.ammo
    });
    plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip, reserve: this.reserve });
  },

  _showMuzzleFlash: function() {
    if (!this._modelRef) return;
    var tip = this._modelRef.getObjectByName('barrel_tip');
    if (!tip) return;
    if (!this._flashSprite) {
      var canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      var ctx = canvas.getContext('2d');
      var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,200,1)');
      g.addColorStop(0.15, 'rgba(255,220,120,0.9)');
      g.addColorStop(0.4, 'rgba(255,120,30,0.5)');
      g.addColorStop(1, 'rgba(255,30,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      var tex = new THREE.CanvasTexture(canvas);
      var mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true });
      this._flashSprite = new THREE.Sprite(mat);
      this._flashSprite.scale.set(0.35, 0.35, 1);
      this._flashSprite.renderOrder = 999;
    }
    tip.add(this._flashSprite);
    this._flashTimer = 0.04;
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this._flashTimer > 0) {
      this._flashTimer -= dt;
      if (this._flashTimer <= 0 && this._flashSprite && this._flashSprite.parent) {
        this._flashSprite.parent.remove(this._flashSprite);
      }
    }
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
    if (this._flashSprite) {
      if (this._flashSprite.parent) this._flashSprite.parent.remove(this._flashSprite);
      if (this._flashSprite.material) { this._flashSprite.material.dispose(); if (this._flashSprite.material.map) this._flashSprite.material.map.dispose(); }
      this._flashSprite = null;
    }
    plugin.off('game:loaded', this.id + '_sounds');
    plugin.off('reload:start', this.id);
    plugin.off('hotbar:select', this.id);
  }
});
