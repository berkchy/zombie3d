var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'weapon_shotgun',
  name: 'Pompali',
  version: '2.0',
  type: 'weapon',
  weaponType: 'shotgun',
  modelId: 'model_shotgun',
  description: 'Pompali tufek — 6 sacma atar, yavas ates eder, animasyonlu',

  cooldown: 0,
  cooldownTime: 0.9,
  pelletsPerShot: 6,
  pelletDamage: 10,
  knockback: 400,
  shake: 0.12,
  spreadAngle: 0.07,
  clip: 6,
  ammo: 6,
  maxAmmo: 30,
  reserve: 24,
  reloadTime: 0.5,
  reloadMode: 'shell',
  _equipping: false,
  _animId: null,
  _animArmId: null,
  _idleAnimId: null,
  _modelRef: null,
  _armsRef: null,
  _restPose: null,
  _armAnims: {
    fire: { duration: 0.15, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.z', keys: [0, 0.03, 0.006, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0, -0.08, 0.01, 0] }
    ]},
    reload: { duration: 0.5, loop: true, tracks: [
      { pivot: '__self__', prop: 'rotation.z', keys: [0, -0.02, -0.03, -0.02, 0] },
      { pivot: 'left_arm', prop: 'position.y', keys: [-0.04, -0.06, -0.12, -0.06, -0.04] },
      { pivot: 'left_arm', prop: 'position.z', keys: [0.03, 0.05, 0.12, 0.05, 0.03] },
      { pivot: 'left_arm', prop: 'rotation.x', keys: [0.02, 0.05, 0.1, 0.05, 0.02] },
      { pivot: 'hand_shell', prop: 'position.z', keys: [0.04, 0.04, 0.22, 0.04, 0.04] },
      { pivot: 'hand_shell', prop: 'position.y', keys: [0, 0, -0.03, 0, 0] },
      { pivot: 'hand_shell_rim', prop: 'position.z', keys: [0.025, 0.025, 0.2, 0.025, 0.025] }
    ]},
    equip: { duration: 1.2, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.y', keys: [-0.5, -0.3, -0.08, 0] },
      { pivot: '__self__', prop: 'position.z', keys: [0.35, 0.18, 0.04, 0] }
    ]}
  },

  init(game) {
    var self = this;
    loader.loadScript('model_shotgun', function(){
      var mp = plugin.get('model_shotgun');
      if (mp && mp.animations && mp.animations.reload) {
        mp.animations.reload.duration = 1.5;
      }
    });
    this.game = game;
    this.cooldown = 0;
    this.ammo = this.clip;
    this.reserve = this.maxAmmo - this.ammo;
    this._equipping = false;
    this._animId = null;
    this._animArmId = null;
    this._idleAnimId = null;
    this._modelRef = null;
    this._armsRef = null;
    this._restPose = null;

    this._armAnims.reload.duration = 1.5;

    plugin.off('game:loaded', this.id + '_sounds');
    plugin.on('game:loaded', this.id + '_sounds', function() {
      if (game.sound) {
        game.sound.addSound('shotgun_fire', {
          label: 'Pompali Atesi', cat: 'silahlar',
          variants: [{ src: ['audio/shotgun_fire.mp3'], volume: 0.9 }]
        });
        game.sound.addSound('shotgun_reload', {
          label: 'Pompali Doldurma', cat: 'silahlar',
          variants: [{ src: ['audio/ump45_reload.mp3'], volume: 0.8 }]
        });
      }
    });

    var self = this;
    plugin.on('reload:start', this.id, function(data) {
      if (!self._modelRef) return;
      if (data && data.weapon && data.weapon.id === self.id) {
        if (self._handShell) self._handShell.visible = true;
        if (self._handShellRim) self._handShellRim.visible = true;
        self._reloading = true;
        self._playAnim('reload');
        if (game.sound) game.sound.play('shotgun_reload');
      }
    });
    plugin.on('hotbar:select', this.id, function() {
      var a = plugin.get('core_animation');
      if (self._animId && a && a.stop) a.stop(self._animId);
      if (self._animArmId && a && a.stop) a.stop(self._animArmId);
      self._animId = null;
      self._animArmId = null;
      self._resetToRestPose();
      self._resetArmsAnimationPose();
      if (self._handShell) self._handShell.visible = false;
      if (self._handShellRim) self._handShellRim.visible = false;
      self._equipping = false;
    });
    plugin.on('bullet:hit', this.id, function(data) {
      if (game.sound) game.sound.playAt('bullet_hit', data ? data.position : null);
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
    this._armRestPos = {};
    this._armRestRot = {};
    this._handShell = null;
    var elbows = [group.getObjectByName('right_elbow'), group.getObjectByName('left_elbow')];
    var wrists = [group.getObjectByName('right_wrist'), group.getObjectByName('left_wrist')];
    if (elbows[0]) this._armRestQ.right_elbow = elbows[0].quaternion.clone();
    if (elbows[1]) this._armRestQ.left_elbow = elbows[1].quaternion.clone();
    if (wrists[0]) this._armRestQ.right_wrist = wrists[0].quaternion.clone();
    if (wrists[1]) this._armRestQ.left_wrist = wrists[1].quaternion.clone();
    var leftArm = group.getObjectByName('left_arm');
    var rightArm = group.getObjectByName('right_arm');
    if (leftArm) {
      this._armRestPos.left_arm = leftArm.position.clone();
      this._armRestRot.left_arm = leftArm.rotation.clone();
    }
    if (rightArm) {
      this._armRestPos.right_arm = rightArm.position.clone();
      this._armRestRot.right_arm = rightArm.rotation.clone();
    }
    if (wrists[1]) {
      var handMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.3 });
      var shell = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.06, 10), handMat);
      shell.rotation.x = Math.PI / 2;
      shell.position.set(0, 0, 0.04);
      shell.name = 'hand_shell';
      shell.visible = false;
      wrists[1].add(shell);
      var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.014, 0.006, 10), new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 }));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0, 0, 0.025);
      rim.name = 'hand_shell_rim';
      rim.visible = false;
      wrists[1].add(rim);
      this._handShell = shell;
      this._handShellRim = rim;
    }
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
    var elbows = [this._armsRef.getObjectByName('right_elbow'), this._armsRef.getObjectByName('left_elbow')];
    var wrists = [this._armsRef.getObjectByName('right_wrist'), this._armsRef.getObjectByName('left_wrist')];
    if (elbows[0] && this._armRestQ && this._armRestQ.right_elbow) elbows[0].quaternion.copy(this._armRestQ.right_elbow);
    if (elbows[1] && this._armRestQ && this._armRestQ.left_elbow) elbows[1].quaternion.copy(this._armRestQ.left_elbow);
    if (wrists[0] && this._armRestQ && this._armRestQ.right_wrist) wrists[0].quaternion.copy(this._armRestQ.right_wrist);
    if (wrists[1] && this._armRestQ && this._armRestQ.left_wrist) wrists[1].quaternion.copy(this._armRestQ.left_wrist);
    var leftArm = this._armsRef.getObjectByName('left_arm');
    var rightArm = this._armsRef.getObjectByName('right_arm');
    if (leftArm && this._armRestPos && this._armRestPos.left_arm) leftArm.position.copy(this._armRestPos.left_arm);
    if (leftArm && this._armRestRot && this._armRestRot.left_arm) leftArm.rotation.copy(this._armRestRot.left_arm);
    if (rightArm && this._armRestPos && this._armRestPos.right_arm) rightArm.position.copy(this._armRestPos.right_arm);
    if (rightArm && this._armRestRot && this._armRestRot.right_arm) rightArm.rotation.copy(this._armRestRot.right_arm);
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
      var mp = plugin.get('model_shotgun');
      if (mp && mp.animations && mp.animations[name]) {
        var def = mp.animations[name];
        var defCb = Object.assign({}, def, {
          onComplete: function() {
            self._resetToRestPose();
            var shell = self._modelRef && self._modelRef.getObjectByName('reload_shell');
            if (shell) shell.visible = false;
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
    if (!a || !a.enabled) return;
    var mp = plugin.get('model_shotgun');
    if (mp && mp.animations && mp.animations.idle) {
      this._idleAnimId = a.play(this._modelRef, mp.animations.idle);
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

    this._playAnim('fire');
    if (this.game.sound) this.game.sound.playAt('shotgun_fire', this.game.camera ? this.game.camera.position : null);

    var bs = plugin.get('system_bullet');
    if (bs && bs.enabled) {
      bs.spawn({ position: pos, direction: dir, speed: 500, damage: this.pelletDamage, knockback: this.knockback, count: this.pelletsPerShot, spread: this.spreadAngle, life: 1.5, size: 0.05 });
    }

    plugin.emit('weapon:fire', {
      weapon: this,
      position: pos,
      direction: dir,
      pellets: this.pelletsPerShot,
      ammo: this.ammo
    });
    plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip, reserve: this.reserve });
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this._reloading) {
      var sys = plugin.get('system_reload');
      if (!sys || !sys._reloading || sys._wp !== this) {
        this._reloading = false;
        var a = plugin.get('core_animation');
        if (this._animId && a && a.stop) a.stop(this._animId);
        if (this._animArmId && a && a.stop) a.stop(this._animArmId);
        this._animId = null;
        this._animArmId = null;
        this._resetToRestPose();
        this._resetArmsAnimationPose();
        if (this._handShell) this._handShell.visible = false;
        if (this._handShellRim) this._handShellRim.visible = false;
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
    plugin.off('game:loaded', this.id + '_sounds');
    plugin.off('reload:start', this.id);
    plugin.off('hotbar:select', this.id);
  }
});
