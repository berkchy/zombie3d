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
  knockbackDistance: 8,
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
  _lastReloadAmmo: 0,
  _flashSprite: null,
  _flashTimer: 0,
  _casings: [],
  _modelRef: null,
  _armsRef: null,
  _restPose: null,
  _armAnims: {
    fire: { duration: 2.0, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.z', keys: [0, 0.03, 0.03, 0.01, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0, -0.08, -0.05, -0.01, 0] },
      { pivot: 'left_arm', prop: 'position.x', keys: [-0.07, -0.07, 0, 0, -0.07], playMs: 800 },
      { pivot: 'left_arm', prop: 'position.y', keys: [-0.04, -0.04, -0.10, -0.10, -0.04], playMs: 800 },
      { pivot: 'left_arm', prop: 'position.z', keys: [0.01, 0.01, -0.15, 0.10, 0.01], playMs: 800 }
    ]},
    reload: { duration: 1.1, loop: true, tracks: [
      { pivot: '__self__', prop: 'rotation.z', keys: [0, -0.02, -0.03, -0.02, 0] },
      { pivot: 'left_arm', prop: 'position.y', keys: [-0.04, -0.1, -0.2, -0.08, -0.04] },
      { pivot: 'left_arm', prop: 'position.z', keys: [0.03, 0.06, 0.12, 0.05, 0.03] },
      { pivot: 'left_arm', prop: 'rotation.x', keys: [0.02, 0.05, 0.1, 0.04, 0.02] },
      { pivot: 'hand_shell', prop: 'position.y', keys: [0.01, 0.01, 0.01, -0.07, 0.01] },
      { pivot: 'hand_shell', prop: 'position.z', keys: [0.02, 0.02, 0.02, 0.06, 0.02] },
      { pivot: 'hand_shell', prop: 'scale.x', keys: [0.01, 0.01, 1, 0.01, 0.01] },
      { pivot: 'hand_shell', prop: 'scale.y', keys: [0.01, 0.01, 1, 0.01, 0.01] },
      { pivot: 'hand_shell', prop: 'scale.z', keys: [0.01, 0.01, 1, 0.01, 0.01] },
      { pivot: 'hand_shell_rim', prop: 'position.y', keys: [0.01, 0.01, 0.01, -0.07, 0.01] },
      { pivot: 'hand_shell_rim', prop: 'position.z', keys: [0.01, 0.01, 0.01, 0.04, 0.01] },
      { pivot: 'hand_shell_rim', prop: 'scale.x', keys: [0.01, 0.01, 1, 0.01, 0.01] },
      { pivot: 'hand_shell_rim', prop: 'scale.y', keys: [0.01, 0.01, 1, 0.01, 0.01] },
      { pivot: 'hand_shell_rim', prop: 'scale.z', keys: [0.01, 0.01, 1, 0.01, 0.01] }
    ]},
    equip: { duration: 1.2, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.y', keys: [-0.5, -0.3, -0.08, 0] },
      { pivot: '__self__', prop: 'position.z', keys: [0.35, 0.18, 0.04, 0] },
      { pivot: '__self__', prop: 'rotation.z', keys: [-0.3, -0.2, -0.08, 0] }
    ]}
  },

  init(game) {
    var self = this;
    loader.loadScript('model_shotgun', function(){
      var mp = plugin.get('model_shotgun');
      if (mp && mp.animations && mp.animations.reload) {
        mp.animations.reload.duration = 1.1;
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
    this._lastReloadAmmo = 0;
    this._flashSprite = null;
    this._flashTimer = 0;
    this._casings = [];

    this._armAnims.reload.duration = 1.1;

    plugin.off('game:loaded', this.id + '_sounds');
    plugin.on('game:loaded', this.id + '_sounds', function() {
      if (game.sound) {
        game.sound.addSound('shotgun_fire', {
          label: 'Pompali Atesi', cat: 'silahlar',
          variants: [{ src: ['audio/shotgun_fire.mp3'], volume: 0.9 }]
        });
        game.sound.addSound('shotgun_pump', {
          label: 'Pompali Pompa', cat: 'silahlar',
          variants: [{ src: ['audio/shotgun_pump.mp3'], volume: 0.8 }]
        });
        game.sound.addSound('shotgun_reload', {
          label: 'Pompali Sarjor', cat: 'silahlar',
          variants: [{ src: ['audio/shotgun_reload.mp3'], volume: 0.7 }]
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
        self._lastReloadAmmo = self.ammo;
        self._playAnim('reload');
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
      var shell = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.075, 10), handMat);
      shell.rotation.x = Math.PI / 2;
      shell.position.set(0, 0.01, 0.015);
      shell.name = 'hand_shell';
      shell.visible = false;
      wrists[1].add(shell);
      var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.02, 0.008, 10), new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.4 }));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0, 0.01, 0.0);
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
    var self = this;
    setTimeout(function() {
      if (self.game && self.game.sound) self.game.sound.play('shotgun_pump');
    }, 500);

    var bs = plugin.get('system_bullet');
    if (bs && bs.enabled) {
      bs.spawn({ position: pos, direction: dir, speed: 500, damage: this.pelletDamage, knockback: this.knockback, knockbackDistance: this.knockbackDistance, count: this.pelletsPerShot, spread: this.spreadAngle, life: 1.5, size: 0.05 });
    }

    this._showMuzzleFlash();
    this._ejectCasing(dir);

    plugin.emit('weapon:fire', {
      weapon: this,
      position: pos,
      direction: dir,
      pellets: this.pelletsPerShot,
      spread: this.spreadAngle,
      ammo: this.ammo
    });
    plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.maxAmmo, clip: this.clip, reserve: this.reserve });
  },

  _showMuzzleFlash: function() {
    if (!this._modelRef) return;
    var tip = this._modelRef.getObjectByName('barrel_tip');
    if (!tip) return;
    var scene = this._modelRef.parent;
    while (scene && scene.parent && scene.parent !== scene) {
      if (scene.parent && scene.parent.type === 'Scene') break;
      scene = scene.parent;
    }

    if (!this._flashSprite) {
      var canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      var ctx = canvas.getContext('2d');
      var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,200,1)');
      g.addColorStop(0.2, 'rgba(255,200,100,0.9)');
      g.addColorStop(0.5, 'rgba(255,100,20,0.5)');
      g.addColorStop(1, 'rgba(255,50,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      var tex = new THREE.CanvasTexture(canvas);
      var mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthTest: false, transparent: true });
      this._flashSprite = new THREE.Sprite(mat);
      this._flashSprite.scale.set(0.3, 0.3, 1);
    }
    tip.add(this._flashSprite);
    this._flashTimer = 0.06;
  },

  _ejectCasing: function(dir) {
    if (!this.game || !this.game.scene) return;
    var mat = new THREE.MeshStandardMaterial({ color: 0xcc8844, metalness: 0.4, roughness: 0.6 });
    var casing = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.025, 6), mat);
    casing.rotation.x = Math.random() * Math.PI;
    var pos = this.game.camera ? this.game.camera.position.clone() : this.game.player.mesh.position.clone();
    pos.y += 0.3;
    var right = new THREE.Vector3(1, 0, 0);
    if (this.game.camera) right.applyQuaternion(this.game.camera.quaternion);
    var up = new THREE.Vector3(0, 1, 0);
    casing.position.copy(pos).add(right.clone().multiplyScalar(0.15)).add(up.clone().multiplyScalar(-0.1));
    var fwd = dir.clone();
    var vel = right.clone().multiplyScalar(1.5 + Math.random() * 0.5).add(up.clone().multiplyScalar(1 + Math.random() * 0.5)).add(fwd.multiplyScalar(0.3));
    this.game.scene.add(casing);
    this._casings.push({ mesh: casing, vel: vel, rot: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10), life: 2.0 });
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this._flashTimer > 0) {
      this._flashTimer -= dt;
      if (this._flashTimer <= 0 && this._flashSprite && this._flashSprite.parent) {
        this._flashSprite.parent.remove(this._flashSprite);
      }
    }

    for (var i = this._casings.length - 1; i >= 0; i--) {
      var c = this._casings[i];
      c.life -= dt;
      if (c.life <= 0) {
        if (this.game && this.game.scene) this.game.scene.remove(c.mesh);
        this._casings.splice(i, 1);
        continue;
      }
      c.vel.y -= 9.8 * dt;
      c.mesh.position.x += c.vel.x * dt;
      c.mesh.position.y += c.vel.y * dt;
      c.mesh.position.z += c.vel.z * dt;
      c.mesh.rotation.x += c.rot.x * dt;
      c.mesh.rotation.y += c.rot.y * dt;
      c.mesh.rotation.z += c.rot.z * dt;
      if (c.mesh.position.y < -0.1) {
        c.mesh.position.y = -0.1;
        c.vel.multiplyScalar(0.3);
        c.rot.multiplyScalar(0.5);
      }
    }

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
      } else {
        if (this.ammo !== this._lastReloadAmmo) {
          this._lastReloadAmmo = this.ammo;
          if (this.game && this.game.sound) this.game.sound.play('shotgun_reload');
        }
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
    for (var i = 0; i < this._casings.length; i++) {
      if (this._casings[i].mesh && this.game && this.game.scene) this.game.scene.remove(this._casings[i].mesh);
    }
    this._casings = [];
    plugin.off('game:loaded', this.id + '_sounds');
    plugin.off('reload:start', this.id);
    plugin.off('hotbar:select', this.id);
  }
});
