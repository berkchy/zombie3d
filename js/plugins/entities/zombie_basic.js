var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'zombie_basic',
  name: 'Basic Zombi',
  version: '1.0',
  type: 'zombie',
  description: 'Standart yavaş zombi — dalga yöneticisine bağlı',

  game: null,
  zombies: [],
  _maxPoligon: 10,

  createModel() {
    var modelPlugin = plugin.get('model_zombie');
    if (modelPlugin && modelPlugin.createModel) {
      return modelPlugin.createModel();
    }
    return new THREE.Group();
  },

  init(game) {
    loader.loadScript('model_zombie', function(){});
    this.game = game;
    this.zombies = [];

    if (game.sound) {
      game.sound.addSound('zombie_attack', {
        randomPlay: true, currentIndex: 0,
        variants: [
          { src: ['audio/zombie_attack_1.mp3'], volume: 0.7 },
          { src: ['audio/zombie_attack_2.mp3'], volume: 0.7 },
          { src: ['audio/zombie_attack_3.mp3'], volume: 0.7 }
        ]
      });
      game.sound.addSound('zombie_death', {
        randomPlay: true, currentIndex: 0,
        variants: [
          { src: ['audio/zombie_death_1.mp3'], volume: 0.7 },
          { src: ['audio/zombie_death_2.mp3'], volume: 0.7 },
          { src: ['audio/zombie_death_3.mp3'], volume: 0.7 },
          { src: ['audio/zombie_death_4.mp3'], volume: 0.7 }
        ]
      });
    }

    var self = this;
    plugin.on('wave:spawn', this.id, function(data) {
      if (!data || !game || !game.player || !game.player.mesh) return;
      if (game.poligonMode && self.zombies.length >= self._maxPoligon) return;
      for (var i = 0; i < data.count; i++) {
        self._spawnZombie(data);
      }
    });

    plugin.on('zombie:die', this.id, function(pos) {
      if (self.game && self.game.sound) self.game.sound.playAt('zombie_death', pos);
    });
  },

  _spawnZombie(config) {
    var game = this.game;
    var playerPos = game.player.mesh.position;
    var x, z;

    if (game.poligonMode || config.poligon) {
      var mapPluginId = game.currentMap ? 'map_' + game.currentMap.id : null;
      var map = mapPluginId ? plugin.get(mapPluginId) : null;
      var spawns = (map && map.getMapConfig) ? map.getMapConfig().zombieSpawns : null;
      if (spawns && spawns.length > 0) {
        var sp = spawns[Math.floor(Math.random() * spawns.length)];
        x = sp[0];
        z = sp[2];
      } else {
        x = playerPos.x + (Math.random() - 0.5) * 8;
        z = playerPos.z + (Math.random() - 0.5) * 8;
      }
    } else {
      var angle = Math.random() * Math.PI * 2;
      var radius = 15 + Math.random() * 5;
      x = playerPos.x + Math.cos(angle) * radius;
      z = playerPos.z + Math.sin(angle) * radius;
      var half = 27;
      x = Math.max(-half, Math.min(half, x));
      z = Math.max(-half, Math.min(half, z));
    }

    var mesh = this.createModel();
    mesh.position.set(x, 0, z);
    game.scene.add(mesh);

    var zombie = {
      mesh: mesh,
      hp: config.hp || 20,
      maxHp: config.maxHp || 20,
      speed: config.speed || 2,
      damage: config.damage || 5,
      attackTimer: 0,
      alive: true,
      dying: false,
      dieTimer: 0,
      _animId: null,
      _lastAnim: null,
      _attacking: false,
      _attackTimer: 0,
      spawnPos: new THREE.Vector3(x, 0, z)
    };

    var anim = plugin.get('core_animation');
    var mp = plugin.get('model_zombie');
    if (anim && anim.enabled && mp && mp.animations) {
      zombie._animId = anim.play(mesh, mp.animations.idle);
    }

    this.zombies.push(zombie);

    plugin.emit('zombie:spawn', {
      zombie: zombie,
      position: zombie.spawnPos,
      wave: config.wave || 1
    });
  },

  update(dt) {
    if (!this.game || !this.game.player || !this.game.player.mesh) return;
    if (this.game.currentMap && this.game.currentMap.mode === 'empty') return;

    var playerPos = this.game.player.mesh.position;
    var toRemove = [];

    for (var i = 0; i < this.zombies.length; i++) {
      var z = this.zombies[i];
      if (!z.alive) { toRemove.push(i); continue; }
      if (z.dying) {
        z.dieTimer -= dt;
        if (z._deathVel) {
          z.mesh.position.x += z._deathVel.x * dt;
          z.mesh.position.z += z._deathVel.z * dt;
          z._deathVel.multiplyScalar(0.96);
          if (z._deathVel.lengthSq() < 0.01) z._deathVel = null;
        }
        if (z.dieTimer <= 0) { z.alive = false; toRemove.push(i); }
        continue;
      }

      var speed = z.speed * dt;
      var dir = new THREE.Vector3()
        .copy(playerPos)
        .sub(z.mesh.position);
      var dist = dir.length();
      dir.normalize();

      var anim = plugin.get('core_animation');
      var mp = plugin.get('model_zombie');

      if (z._attacking) {
        z._attackTimer -= dt;
        if (z._attackTimer <= 0) {
          z._attacking = false;
          this.game.player.takeDamage(z.damage);
          z.attackTimer = 0.5;
          if (anim && anim.enabled && mp && mp.animations) {
            if (z._animId) anim.stop(z._animId);
            z._animId = anim.play(z.mesh, mp.animations.idle);
            z._lastAnim = 'idle';
          }
        }
      } else if (dist > 0.5) {
        z.mesh.position.x += dir.x * speed;
        z.mesh.position.z += dir.z * speed;
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        if (anim && anim.enabled && mp && mp.animations) {
          if (!z._animId || z._lastAnim !== 'walk') {
            if (z._animId) anim.stop(z._animId);
            z._animId = anim.play(z.mesh, mp.animations.walk);
            z._lastAnim = 'walk';
          }
        }
      } else {
        if (z.attackTimer <= 0) {
          z._attacking = true;
          z._attackTimer = 0.5;
          if (this.game && this.game.sound) this.game.sound.playAt('zombie_attack', z.mesh.position);
          if (anim && anim.enabled && mp && mp.animations) {
            if (z._animId) anim.stop(z._animId);
            z._animId = anim.play(z.mesh, mp.animations.attack);
            z._lastAnim = 'attack';
          }
        } else {
          z.attackTimer -= dt;
          if (anim && anim.enabled && mp && mp.animations) {
            if (!z._animId || z._lastAnim !== 'idle') {
              if (z._animId) anim.stop(z._animId);
              z._animId = anim.play(z.mesh, mp.animations.idle);
              z._lastAnim = 'idle';
            }
          }
        }
      }
    }

    for (var i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      if (this.zombies[idx] && this.zombies[idx].mesh) {
        this.game.scene.remove(this.zombies[idx].mesh);
      }
      this.zombies.splice(idx, 1);
    }
  },

  hitTest(bulletPos, radius, damage) {
    damage = damage || 25;
    for (var i = 0; i < this.zombies.length; i++) {
      var z = this.zombies[i];
      if (!z.alive || z.dying) continue;

      var bodyPos = new THREE.Vector3(z.mesh.position.x, z.mesh.position.y + 0.5, z.mesh.position.z);
      var headPos = new THREE.Vector3(z.mesh.position.x, z.mesh.position.y + 0.9, z.mesh.position.z);
      var r = radius + 0.4;

      var bodyDist = bulletPos.distanceTo(bodyPos);
      var headDist = bulletPos.distanceTo(headPos);
      var isHeadshot = headDist < r * 0.8;
      var isHit = bodyDist < r || headDist < r;

      if (isHit) {
        var finalDmg = isHeadshot ? damage * 2.5 : damage;
        z.hp -= finalDmg;
        plugin.emit('zombie:hit', {
          zombie: z,
          damage: finalDmg,
          hp: z.hp,
          position: z.mesh.position.clone(),
          headshot: isHeadshot
        });
        if (z.hp <= 0) {
          z.dying = true;
          z.dieTimer = 1.6;
          z._deathVel = new THREE.Vector3().copy(z.mesh.position).sub(bulletPos).normalize().multiplyScalar(3);
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
        return true;
      }
    }
    return false;
  },

  destroy() {
    this.zombies.forEach(function(z) {
      if (z.mesh && this.game) this.game.scene.remove(z.mesh);
    }, this);
    this.zombies = [];
  }
});
