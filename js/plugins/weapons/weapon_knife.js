var plugin = window.include('registry');
var loader = window.include('loader');
// ===== weapon_knife =====
plugin.register({
  id: 'weapon_knife',
  name: 'Bıçak',
  version: '2.0',
  type: 'weapon',
  weaponType: 'knife',
  modelId: 'model_knife',
  description: 'Yakın dövüş — önündeki zombileri keser',

  cooldown: 0,
  cooldownTime: 0.5,
  range: 2.2,
  damage: 60,
  arcAngle: 1.2,
  _equipping: false,
  _modelRef: null,
  _animId: null,
  _armsRef: null,
  _animArmId: null,
  _restPose: null,
  _armAnims: {
    fire: { duration: 1.2, loop: false, tracks: [
      // Kollar ana hareketi yapiyor — bıçak bunun içinde hafifçe oynar
      { pivot: '__self__', prop: 'position.x', keys: [0, 0.02, -0.28, -0.32, 0] },
      { pivot: '__self__', prop: 'position.z', keys: [0, -0.01, 0.005, 0.01, 0] },
      { pivot: '__self__', prop: 'rotation.z', keys: [0, -0.02, 0.18, 0.22, 0] },
      { pivot: '__self__', prop: 'rotation.y', keys: [0, 0.015, -0.10, -0.12, 0] }
    ]}
  },

  init(game) {
    loader.loadScript('model_knife', function(){});
    this.game = game;
    this.cooldown = 0;
    this._modelRef = null;
    this._animId = null;
    this._animArmId = null;
    this._restPose = null;
    this._equipping = false;

    plugin.off('game:loaded', this.id + '_sounds');
    var self = this;
    plugin.on('game:loaded', this.id + '_sounds', function() {
      if (game.sound) {
        game.sound.addSound('knife_swing', {
          randomPlay: true, currentIndex: 0,
          variants: [
            { src: ['audio/knife_swing_1.mp3'], volume: 0.8 }
          ]
        });
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
    this._animId = null;
    this._animArmId = null;

    this._resetToRestPose();

    var self = this;

    if (this._modelRef) {
      var mp = plugin.get('model_knife');
      if (mp && mp.animations && mp.animations[name]) {
        var def = mp.animations[name];
        var defCb = Object.assign({}, def, {
          onComplete: function() {
            self._resetToRestPose();
            if (name === 'equip') self._equipping = false;
          }
        });
        this._animId = a.play(this._modelRef, defCb);
      }
    }
    if (this._armsRef && this._armAnims && this._armAnims[name]) {
      this._animArmId = a.play(this._armsRef, this._armAnims[name]);
    }
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this._equipping) return;
    this.cooldown = this.cooldownTime;

    this._playAnim('fire');
    if (this.game.sound) this.game.sound.playAt('knife_swing', this.game.camera ? this.game.camera.position : null);

    var zp = plugin.get('zombie_basic');
    if (!zp || !zp.enabled || !zp.zombies) return;

    var pos = owner.mesh.position.clone();
    pos.y += 0.35;

    var forward = new THREE.Vector3(0, 0, 1);
    var fp = plugin.get('fx_firstperson');
    if (fp && fp.enabled) {
      forward.set(0, 0, -1);
      forward.applyQuaternion(this.game.camera.quaternion);
    } else {
      forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), owner.mesh.rotation.y);
    }

    var hitCount = 0;

    for (var i = 0; i < zp.zombies.length; i++) {
      var z = zp.zombies[i];
      if (!z.alive || z.dying) continue;

      var toZombie = new THREE.Vector3().copy(z.mesh.position).sub(pos);
      var dist = toZombie.length();
      if (dist > this.range) continue;

      toZombie.normalize();
      var angle = forward.angleTo(toZombie);
      if (angle > this.arcAngle) continue;

      z.hp -= this.damage;
      hitCount++;

      plugin.emit('zombie:hit', {
        zombie: z,
        damage: this.damage,
        hp: z.hp,
        position: z.mesh.position.clone()
      });

      if (z.hp <= 0) {
        z.dying = true;
        z.dieTimer = 1.6;
        z._deathVel = toZombie.clone().multiplyScalar(2.5);
        this.game.score += 10;
        document.getElementById('scoreVal').textContent = this.game.score;

        var anim = plugin.get('core_animation');
        var mp = plugin.get('model_zombie');
        if (anim && anim.enabled && mp && mp.animations && z._animId) {
          anim.stop(z._animId);
          z._animId = null;
        }
        if (anim && anim.enabled && mp && mp.animations) {
          z._animId = anim.play(z.mesh, mp.animations.die);
        }
        plugin.emit('zombie:die', z.mesh.position.clone());
      }
    }

    plugin.emit('weapon:fire', {
      weapon: this,
      range: this.range,
      hits: hitCount
    });
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
  },

  destroy() {
    this._modelRef = null;
    this._armsRef = null;
    this._animId = null;
    this._animArmId = null;
    this._restPose = null;
    plugin.off('hotbar:select', this.id);
  }
});
