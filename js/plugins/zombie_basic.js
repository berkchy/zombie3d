PluginRegistry.register({
  id: 'zombie_basic',
  name: 'Basic Zombi',
  version: '1.0',
  type: 'zombie',
  description: 'Standart yavaş zombi + spawn/hit/wave eventleri',

  game: null,
  zombies: [],
  spawnTimer: 0,
  spawnInterval: 2.0,
  wave: 1,
  baseCount: 3,

  createModel() {
    var modelPlugin = PluginRegistry.get('model_zombie');
    if (modelPlugin && modelPlugin.createModel) {
      return modelPlugin.createModel();
    }
    return new THREE.Group();
  },

  init(game) {
    this.game = game;
    this.spawnTimer = 1.0;
    this.zombies = [];
    this.wave = 1;
  },

  update(dt) {
    if (!this.game || !this.game.player || !this.game.player.mesh) return;

    if (this.game.poligonMode) {
      // Poligon modu: sabit zombiler, dalga yok
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.zombies.length < 10) {
        this.spawnTimer = 2.0;
        this.spawnZombie();
      }

      // Olu zombileri kaldir
      var toRemove = [];
      for (var i = 0; i < this.zombies.length; i++) {
        if (!this.zombies[i].alive) toRemove.push(i);
      }
      for (var i = toRemove.length - 1; i >= 0; i--) {
        var idx = toRemove[i];
        if (this.zombies[idx] && this.zombies[idx].mesh) {
          this.game.scene.remove(this.zombies[idx].mesh);
        }
        this.zombies.splice(idx, 1);
      }
      return;
    }

    // Dalga kontrolü
    var newWave = Math.floor(this.game.elapsed / 30) + 1;
    if (newWave !== this.wave) {
      PluginRegistry.emit('wave:change', { oldWave: this.wave, newWave: newWave });
      this.wave = newWave;
    }
    document.getElementById('waveVal').textContent = this.wave;

    // Spawn
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.5, this.spawnInterval - this.wave * 0.05);
      var count = Math.floor(1 + this.wave * 0.5);
      for (var i = 0; i < count; i++) {
        this.spawnZombie();
      }
    }

    // Zombileri güncelle
    var playerPos = this.game.player.mesh.position;
    var toRemove = [];

    for (var i = 0; i < this.zombies.length; i++) {
      var z = this.zombies[i];
      if (!z.alive) { toRemove.push(i); continue; }

      var speed = z.speed * dt;
      var dir = new THREE.Vector3()
        .copy(playerPos)
        .sub(z.mesh.position);
      var dist = dir.length();
      dir.normalize();

      if (dist > 0.5) {
        z.mesh.position.x += dir.x * speed;
        z.mesh.position.z += dir.z * speed;
        z.mesh.rotation.y = Math.atan2(-dir.x, -dir.z);
      } else {
        if (z.attackTimer <= 0) {
          this.game.player.takeDamage(z.damage);
          z.attackTimer = 1.0;
        }
      }

      z.attackTimer -= dt;
    }

    // Ölü zombileri kaldır
    for (var i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      if (this.zombies[idx] && this.zombies[idx].mesh) {
        this.game.scene.remove(this.zombies[idx].mesh);
      }
      this.zombies.splice(idx, 1);
    }
  },

  spawnZombie() {
    var game = this.game;
    var playerPos = game.player.mesh.position;

    var angle = Math.random() * Math.PI * 2;
    var radius = 15 + Math.random() * 5;
    var x = playerPos.x + Math.cos(angle) * radius;
    var z = playerPos.z + Math.sin(angle) * radius;

    var half = 27;
    var clampedX = Math.max(-half, Math.min(half, x));
    var clampedZ = Math.max(-half, Math.min(half, z));

    var mesh = this.createModel();
    mesh.position.set(clampedX, 0, clampedZ);
    game.scene.add(mesh);

    var zombie = {
      mesh: mesh,
      hp: 20 + this.wave * 5,
      maxHp: 20 + this.wave * 5,
      speed: 2 + this.wave * 0.2,
      damage: 5 + this.wave * 1,
      attackTimer: 0,
      alive: true,
      spawnPos: new THREE.Vector3(clampedX, 0, clampedZ)
    };

    this.zombies.push(zombie);

    PluginRegistry.emit('zombie:spawn', {
      zombie: zombie,
      position: zombie.spawnPos,
      wave: this.wave
    });
  },

  hitTest(bulletPos, radius) {
    for (var i = 0; i < this.zombies.length; i++) {
      var z = this.zombies[i];
      if (!z.alive) continue;
      var dist = bulletPos.distanceTo(z.mesh.position);
      if (dist < radius + 0.4) {
        z.hp -= 25;
        PluginRegistry.emit('zombie:hit', {
          zombie: z,
          damage: 25,
          hp: z.hp,
          position: z.mesh.position.clone()
        });
        if (z.hp <= 0) {
          z.alive = false;
          this.game.score += 10;
          document.getElementById('scoreVal').textContent = this.game.score;
          PluginRegistry.emit('zombie:die', z.mesh.position.clone());
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
