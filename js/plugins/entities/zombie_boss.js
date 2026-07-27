var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'zombie_boss',
  name: 'Boss Zombi',
  type: 'zombie',
  version: '1.0',
  description: 'Boss zombi — iri, zırhlı, her 5 dalgada bir gelir',

  game: null,
  boss: null,
  _canMove: true,

  createModel() {
    var mp = plugin.get('model_boss');
    if (mp && mp.createModel) return mp.createModel();
    return new THREE.Group();
  },

  init(game) {
    loader.loadScript('model_boss', function(){});
    this.game = game;
    this.boss = null;
    this._canMove = true;

    if (game.sound) {
      game.sound.addSound('boss_spawn', {
        label: 'Boss Doğma', cat: 'boss',
        variants: [{ src: ['audio/zombie_boss_spawn.mp3'], volume: 1.0 }]
      });
      game.sound.addSound('boss_attack', {
        randomPlay: true, currentIndex: 0, label: 'Boss Saldırısı', cat: 'boss',
        variants: [
          { src: ['audio/zombie_boss_attack_1.mp3'], volume: 1.0 },
          { src: ['audio/zombie_boss_attack_2.mp3'], volume: 1.0 },
          { src: ['audio/zombie_boss_attack_3.mp3'], volume: 1.0 }
        ]
      });
      game.sound.addSound('boss_pain', {
        randomPlay: true, currentIndex: 0, label: 'Boss Acı', cat: 'boss',
        variants: [
          { src: ['audio/zombie_boss_pain_1.mp3'], volume: 1.0 },
          { src: ['audio/zombie_boss_pain_2.mp3'], volume: 1.0 },
          { src: ['audio/zombie_boss_pain_3.mp3'], volume: 1.0 },
          { src: ['audio/zombie_boss_pain_4.mp3'], volume: 1.0 }
        ]
      });
      game.sound.addSound('boss_death', {
        label: 'Boss Ölüm', cat: 'boss',
        variants: [{ src: ['audio/zombie_boss_pain_4.mp3'], volume: 1.0 }]
      });
    }

    var self = this;
    plugin.on('boss:spawn', this.id, function(data) {
      if (!data || !game || !game.player || !game.player.mesh) return;
      if (self.boss && self.boss.alive) return;
      self._spawnBoss(data);
    });

    plugin.on('wave:movement', this.id, function(data) {
      self._canMove = data && data.canMove;
      plugin.emit('movement:set_speed', { entityId: 'boss', canMove: self._canMove });
    });
  },

  _spawnBoss(data) {
    var game = this.game;
    var wave = data.wave || 5;

    var mapPluginId = game.currentMap ? 'map_' + game.currentMap.id : null;
    var map = mapPluginId ? plugin.get(mapPluginId) : null;
    var spawns = (map && map.getMapConfig) ? map.getMapConfig().zombieSpawns : null;

    var x, z;
    if (spawns && spawns.length > 0) {
      var sp = spawns[Math.floor(Math.random() * spawns.length)];
      x = sp[0]; z = sp[2];
    } else {
      var angle = Math.random() * Math.PI * 2;
      var radius = 8 + Math.random() * 4;
      x = game.player.mesh.position.x + Math.cos(angle) * radius;
      z = game.player.mesh.position.z + Math.sin(angle) * radius;
    }

    var mesh = this.createModel();
    mesh.position.set(x, 0, z);
    mesh.scale.set(1, 1, 1);
    game.scene.add(mesh);

    // Oyuncuya doğru dön
    mesh.rotation.y = Math.atan2(
      game.player.mesh.position.x - x,
      game.player.mesh.position.z - z
    );

    var hp = (20 + (wave - 1) * 5) * 5;
    this.boss = {
      mesh: mesh,
      hp: hp,
      maxHp: hp,
      speed: 1.5,
      damage: (5 + (wave - 1) * 1) * 3,
      alive: true,
      dying: false,
      dieTimer: 0,
      roaring: true,
      roarTimer: 3.0,
      _trembling: false,
      _trembleTimer: 0,
      _animId: null,
      _lastAnim: null,
      _attacking: false,
      _attackTimer: 0,
      attackTimer: 0,
      spawnPos: new THREE.Vector3(x, 0, z)
    };

    var anim = plugin.get('core_animation');
    var mp = plugin.get('model_boss');
    if (game.sound) game.sound.playAt('boss_spawn', this.boss.spawnPos);

    if (anim && anim.enabled && mp && mp.animations) {
      this.boss._animId = anim.play(mesh, mp.animations.roar);
      this.boss._lastAnim = 'roar';
    }

    var hitbox = plugin.get('system_hitbox');
    if (hitbox && hitbox.enabled && mp && typeof mp.getHitboxDefs === 'function') {
      hitbox.createHitboxes(mesh, mp.getHitboxDefs());
    }

    plugin.emit('movement:register', {
      entityId: 'boss',
      mesh: mesh,
      speed: this.boss.speed,
      radius: 0.6,
      canMove: false
    });

    plugin.emit('boss:entered', {
      boss: this.boss,
      position: this.boss.spawnPos,
      wave: wave
    });
  },

  update(dt) {
    if (!this.boss || !this.boss.alive) return;
    if (!this.game || !this.game.player || !this.game.player.mesh) return;

    var boss = this.boss;
    var playerPos = this.game.player.mesh.position;

    if (boss.dying) {
      boss.dieTimer -= dt;
      if (boss.dieTimer <= 0) {
        boss.alive = false;
        plugin.emit('movement:unregister', { entityId: 'boss' });
        if (boss.mesh && this.game) {
          var hb = plugin.get('system_hitbox');
          if (hb && hb.enabled) hb.removeHitboxes(boss.mesh);
          this.game.scene.remove(boss.mesh);
        }
        this.boss = null;
      }
      return;
    }

    if (boss.roaring) {
      boss.roarTimer -= dt;
      if (boss.roarTimer <= 0) {
        boss.roaring = false;
        boss._trembling = true;
        boss._trembleTimer = 1.5;
      }
      return;
    }

    if (boss._trembling) {
      boss._trembleTimer -= dt;
      var armL = boss.mesh.getObjectByName('armL');
      var armR = boss.mesh.getObjectByName('armR');
      if (armL) armL.rotation.z += (Math.random() - 0.5) * 0.12;
      if (armR) armR.rotation.z += (Math.random() - 0.5) * 0.12;
      if (boss._trembleTimer <= 0) {
        boss._trembling = false;
        var anim = plugin.get('core_animation');
        var mp = plugin.get('model_boss');
        if (anim && anim.enabled && mp && mp.animations) {
          if (boss._animId) anim.stop(boss._animId);
          boss._animId = anim.play(boss.mesh, mp.animations.idle);
          boss._lastAnim = 'idle';
        }
        plugin.emit('movement:set_speed', { entityId: 'boss', canMove: this._canMove });
      }
      return;
    }

    if (!this._canMove) {
      plugin.emit('movement:stop', { entityId: 'boss' });
      return;
    }

    if (boss._stunTimer > 0) {
      boss._stunTimer -= dt;
      if (boss._stunTimer <= 0) {
        plugin.emit('movement:set_speed', { entityId: 'boss', speed: boss.speed });
      }
    }

    var dir = new THREE.Vector3()
      .copy(playerPos)
      .sub(boss.mesh.position);
    var dist = dir.length();
    dir.normalize();

    var anim = plugin.get('core_animation');
    var mp = plugin.get('model_boss');

    if (boss._attacking) {
      plugin.emit('movement:stop', { entityId: 'boss' });
      boss._attackTimer -= dt;
      if (boss._attackTimer <= 0) {
        boss._attacking = false;
        this.game.player.takeDamage(boss.damage);
        boss.attackTimer = 1.0;
        if (anim && anim.enabled && mp && mp.animations) {
          if (boss._animId) anim.stop(boss._animId);
          boss._animId = anim.play(boss.mesh, mp.animations.idle);
          boss._lastAnim = 'idle';
        }
      }
    } else if (dist > 1.2) {
      plugin.emit('movement:move_to', { entityId: 'boss', target: playerPos });
      boss.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      if (anim && anim.enabled && mp && mp.animations) {
        if (!boss._animId || boss._lastAnim !== 'walk') {
          if (boss._animId) anim.stop(boss._animId);
          boss._animId = anim.play(boss.mesh, mp.animations.walk);
          boss._lastAnim = 'walk';
        }
      }
    } else {
      if (boss.attackTimer <= 0) {
        boss._attacking = true;
        boss._attackTimer = 1.2;
        if (this.game && this.game.sound) this.game.sound.playAt('boss_attack', boss.mesh.position);
        if (anim && anim.enabled && mp && mp.animations) {
          if (boss._animId) anim.stop(boss._animId);
          boss._animId = anim.play(boss.mesh, mp.animations.attack);
          boss._lastAnim = 'attack';
        }
      } else {
        boss.attackTimer -= dt;
        if (anim && anim.enabled && mp && mp.animations) {
          if (!boss._animId || boss._lastAnim !== 'idle') {
            if (boss._animId) anim.stop(boss._animId);
            boss._animId = anim.play(boss.mesh, mp.animations.idle);
            boss._lastAnim = 'idle';
          }
        }
      }
    }
  },

  hitTest(bulletPos, radius, damage, extra) {
    if (!this.boss || !this.boss.alive || this.boss.dying) return false;
    var boss = this.boss;
    damage = damage || 25;
    var hitbox = plugin.get('system_hitbox');
    var hasHitbox = hitbox && hitbox.enabled;

    if (hasHitbox && boss.mesh.userData && boss.mesh.userData.hitboxes) {
      var hitType = hitbox.getHitTypeAtPoint(boss.mesh, bulletPos);
      if (!hitType) return false;
      return this._hit(boss, bulletPos, damage, hitType, hitbox, extra);
    }

    var bodyPos = new THREE.Vector3(boss.mesh.position.x, boss.mesh.position.y + 0.7, boss.mesh.position.z);
    var headPos = new THREE.Vector3(boss.mesh.position.x, boss.mesh.position.y + 1.4, boss.mesh.position.z);
    var r = radius + 0.6;
    if (!(bulletPos.distanceTo(bodyPos) < r || bulletPos.distanceTo(headPos) < r)) return false;
    var hitType = bulletPos.distanceTo(headPos) < r * 0.8 ? 'head' : 'chest';
    return this._hit(boss, bulletPos, damage, hitType, null, extra);
  },

  _hit(boss, bulletPos, damage, hitType, hitbox, extra) {
    var dist = bulletPos.distanceTo(boss.mesh.position);
    var finalDmg = hitbox ? hitbox.calcDamage(damage, hitType, dist) : (hitType === 'head' ? damage * 2.0 : damage);
    var ev = { damage: finalDmg, hitType: hitType, enemy: boss, knockback: (extra && extra.knockback) || 0, position: boss.mesh.position.clone() };
    plugin.emit('enemy:hit', ev);
    finalDmg = ev.damage;
    boss.hp -= finalDmg;
    boss._stunTimer = 0.3;
    plugin.emit('movement:set_speed', { entityId: 'boss', speed: boss.speed * 0.3 });
    plugin.emit('zombie:hit', {
      zombie: boss, damage: finalDmg, hp: boss.hp, position: boss.mesh.position.clone(),
      headshot: hitType === 'head', hitType: hitType
    });

    var kbVal = (extra && extra.knockback) || 0;
    var kbDist = (extra && extra.knockbackDistance) || 10;
    if (kbVal > 0) {
      var kbSys = plugin.get('entity_knockback');
      if (kbSys && kbSys.enabled) {
        var kbDir = (extra && extra.direction) ? extra.direction.clone().normalize() : new THREE.Vector3().copy(boss.mesh.position).sub(bulletPos).normalize();
        kbSys.applyAt(boss.mesh, bulletPos, kbVal, kbDir, 200, kbDist);
      }
    }
    if (this.game && this.game.sound) this.game.sound.playAt('boss_pain', boss.mesh.position);
    if (boss.hp <= 0) {
      boss.dying = true;
      boss.dieTimer = 2.5;
      plugin.emit('movement:stop', { entityId: 'boss' });
      if (this.game && this.game.sound) this.game.sound.playAt('boss_death', boss.mesh.position);
      this.game.score += 100;
      document.getElementById('scoreVal').textContent = this.game.score;
      var anim = plugin.get('core_animation');
      var mp = plugin.get('model_boss');
      if (anim && anim.enabled && mp && mp.animations) {
        if (boss._animId) anim.stop(boss._animId);
        boss._animId = anim.play(boss.mesh, mp.animations.die);
      }
      plugin.emit('player:kill', { enemy: boss, type: 'boss', score: 100, position: boss.mesh.position.clone() });
      plugin.emit('boss:die', boss.mesh.position.clone());
    }
    return true;
  },

  destroy() {
    if (this.boss && this.boss.mesh && this.game) {
      var hb = plugin.get('system_hitbox');
      if (hb && hb.enabled) hb.removeHitboxes(this.boss.mesh);
      this.game.scene.remove(this.boss.mesh);
    }
    this.boss = null;
    plugin.off('boss:spawn', this.id);
    plugin.off('wave:movement', this.id);
  }
});
