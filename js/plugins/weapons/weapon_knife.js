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
  knockback: 60,
  knockbackDistance: 3,
  shake: 0,
  arcAngle: 1.2,
  _equipping: false,
  _modelRef: null,
  _animId: null,
  _armsRef: null,
  _animArmId: null,
  _restPose: null,
  _armAnims: {
    fire: { duration: 1.0, loop: false, tracks: [
      { pivot: 'right_arm', prop: 'position.x', keys: [0, -0.02, -0.16, -0.10, 0] },
      { pivot: 'right_arm', prop: 'position.z', keys: [0, 0.01, -0.05, -0.02, 0] },
      { pivot: 'right_arm', prop: 'rotation.z', keys: [0, -0.01, 0.10, 0.05, 0] },
      { pivot: 'left_arm', prop: 'position.z', keys: [0, 0.01, 0.06, 0.03, 0] }
    ]},
    equip: { duration: 1.5, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.y', keys: [-0.5, -0.3, -0.05, 0.02, 0] },
      { pivot: '__self__', prop: 'position.z', keys: [0.3, 0.2, 0.08, 0.02, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0.5, 0.3, 0.1, 0.02, 0] }
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
          randomPlay: true, currentIndex: 0, label: 'Bıçak Sallama', cat: 'silahlar',
          variants: [
            { src: ['audio/knife_swing_1.mp3'], volume: 0.8 }
          ]
        });
        game.sound.addSound('knife_equip', {
          label: 'Bıçak Kuşanma', cat: 'silahlar',
          variants: [{ src: ['audio/knife_equip.mp3'], volume: 0.7 }]
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
      self._resetArmsPose();
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
    if (this.game.sound) this.game.sound.play('knife_equip');
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

  _resetArmsPose: function() {
    if (!this._armsRef) return;
    var ra = this._armsRef.getObjectByName('right_arm');
    if (ra) {
      ra.position.x = 0;
      ra.position.z = 0;
      ra.rotation.z = 0;
    }
    var la = this._armsRef.getObjectByName('left_arm');
    if (la) {
      la.position.z = 0;
    }
  },

  _playAnim: function(name) {
    var a = plugin.get('core_animation');
    if (!a || !a.enabled) return;

    if (this._animId && a.playing && a.playing[this._animId]) a.stop(this._animId);
    if (this._animArmId && a.playing && a.playing[this._animArmId]) a.stop(this._animArmId);
    this._animId = null;
    this._animArmId = null;

    if (name !== 'equip') {
      this._resetToRestPose();
      this._resetArmsPose();
    }

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
      var armDef = Object.assign({}, this._armAnims[name], {
        onComplete: function() {
          self._resetArmsPose();
        }
      });
      this._animArmId = a.play(this._armsRef, armDef);
    }
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this._equipping) return;
    this.cooldown = this.cooldownTime;

    this._playAnim('fire');
    if (this.game.sound) this.game.sound.playAt('knife_swing', this.game.camera ? this.game.camera.position : null);

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
    var hitbox = plugin.get('system_hitbox');
    var hasHitbox = hitbox && hitbox.enabled;

    // Tüm zombie_basic zombilerini kontrol et
    var zp = plugin.get('zombie_basic');
    if (zp && zp.enabled && zp.zombies) {
      for (var i = 0; i < zp.zombies.length; i++) {
        var z = zp.zombies[i];
        if (!z.alive || z.dying) continue;

        var toZombie = new THREE.Vector3().copy(z.mesh.position).sub(pos);
        var dist = toZombie.length();
        if (dist > this.range) continue;
        toZombie.normalize();
        var angle = forward.angleTo(toZombie);
        if (angle > this.arcAngle) continue;

        this._hitEnemy(z, pos, dist, hasHitbox, hitbox);
        hitCount++;
      }
    }

    // Boss kontrolü
    var bossPlugin = plugin.get('zombie_boss');
    if (bossPlugin && bossPlugin.enabled && bossPlugin.boss && bossPlugin.boss.alive && !bossPlugin.boss.dying) {
      var boss = bossPlugin.boss;
      var toBoss = new THREE.Vector3().copy(boss.mesh.position).sub(pos);
      var bossDist = toBoss.length();
      if (bossDist <= this.range) {
        toBoss.normalize();
        var bossAngle = forward.angleTo(toBoss);
        if (bossAngle <= this.arcAngle) {
          var hitPt = boss.mesh.position.clone();
          hitPt.y += 0.5;
          var hitType = 'chest';
          if (hasHitbox && boss.mesh.userData && boss.mesh.userData.hitboxes) {
            var ht = hitbox.getHitTypeAtPoint(boss.mesh, hitPt);
            if (ht) hitType = ht;
          }
          bossPlugin._hit(boss, hitPt, this.damage, hitType, hasHitbox ? hitbox : null, { direction: toBoss, knockback: this.knockback });
          hitCount++;
        }
      }
    }

    plugin.emit('weapon:fire', {
      weapon: this,
      range: this.range,
      hits: hitCount
    });
  },

  _hitEnemy(enemy, origin, dist, hasHitbox, hitbox) {
    var hitPt = enemy.mesh.position.clone();
    hitPt.y += 0.5;
    var dmg = this.damage;
    var hitType = 'chest';

    if (hasHitbox && enemy.mesh.userData && enemy.mesh.userData.hitboxes) {
      var ht = hitbox.getHitTypeAtPoint(enemy.mesh, hitPt);
      if (ht) {
        hitType = ht;
        dmg = hitbox.calcDamage(this.damage, hitType, dist);
      }
    } else {
      var headPos = new THREE.Vector3(enemy.mesh.position.x, enemy.mesh.position.y + 0.9, enemy.mesh.position.z);
      if (hitPt.distanceTo(headPos) < 0.5) {
        hitType = 'head';
        dmg = this.damage * 2.5;
      }
    }

    enemy.hp -= dmg;
    enemy._stunTimer = 0.3;
    if (enemy._moveId) plugin.emit('movement:set_speed', { entityId: enemy._moveId, speed: enemy.speed * 0.3 });

    plugin.emit('enemy:hit', {
      damage: dmg, hitType: hitType, enemy: enemy,
      knockback: this.knockback, position: enemy.mesh.position.clone()
    });

    plugin.emit('zombie:hit', {
      zombie: enemy,
      damage: dmg,
      hp: enemy.hp,
      position: enemy.mesh.position.clone(),
      headshot: hitType === 'head',
      hitType: hitType
    });

    var kbSys = plugin.get('entity_knockback');
    if (kbSys && kbSys.enabled) {
      var kbDir = new THREE.Vector3().copy(enemy.mesh.position).sub(origin).normalize();
      kbSys.applyAt(enemy.mesh, origin, this.knockback, kbDir, 70, this.knockbackDistance);
    }

    if (enemy.hp <= 0 && !enemy.dying) {
      enemy.dying = true;
      enemy.dieTimer = 1.6;
      var dir = new THREE.Vector3().copy(enemy.mesh.position).sub(origin).normalize();
      enemy._deathVel = dir.multiplyScalar(2.5);
      this.game.score += 10;
      document.getElementById('scoreVal').textContent = this.game.score;

      var anim = plugin.get('core_animation');
      var modelPlugin = plugin.get('model_zombie');
      if (anim && anim.enabled && modelPlugin && modelPlugin.animations) {
        if (enemy._animId) { anim.stop(enemy._animId); enemy._animId = null; }
        enemy._animId = anim.play(enemy.mesh, modelPlugin.animations.die);
      }
      plugin.emit('zombie:die', enemy.mesh.position.clone());
    }
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
    plugin.off('game:loaded', this.id + '_sounds');
    plugin.off('hotbar:select', this.id);
  }
});
