PluginRegistry.register({
  id: 'player_basic',
  name: 'Oyuncu',
  version: '1.0',
  type: 'player',
  description: '3D oyuncu karakteri + XP/Level',
  priority: 10,
  enabled: true,

  game: null,
  mesh: null,
  weaponMesh: null,

  speed: 6,
  hp: 100,
  maxHp: 100,
  color: 0x4fc3f7,
  bodyScale: 1,
  invincible: false,
  dodgeCooldown: 0,

  xp: 0,
  level: 1,
  xpToNext: 50,

  init(game) {
    this.game = game;
    this.hp = this.maxHp;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 50;

    // ---------- 3D Model (model_player eklentisinden) ----------
    var modelPlugin = PluginRegistry.get('model_player');
    var group;
    if (modelPlugin && modelPlugin.enabled && modelPlugin.createModel) {
      group = modelPlugin.createModel();
    } else {
      group = new THREE.Group();
    }
    this.mesh = group;
    this.bodyMesh = group.getObjectByName('body');
    this.headMesh = group.getObjectByName('head');
    this.bodyMat = group.userData ? group.userData.bodyMat : null;
    this.headMat = group.userData ? group.userData.headMat : null;
    if (this.bodyMat) this.bodyMat.color.setHex(this.color);

    // Silah modelini weapon_slot'a tak
    this.weaponMesh = null;
    var slot = group.getObjectByName('weapon_slot');
    if (slot) {
      var pistolPlugin = PluginRegistry.get('model_pistol');
      if (pistolPlugin && pistolPlugin.enabled && typeof pistolPlugin.createModel === 'function') {
        var pistol = pistolPlugin.createModel();
        pistol.rotation.y = -Math.PI / 2;
        slot.add(pistol);
        this.weaponMesh = pistol;
      }
    }

    game.scene.add(group);
    game.player = this;
    game.playerMesh = group;

    // Dodge event — input_manager'dan gelir
    var self = this;
    PluginRegistry.on('player:dodge', 'player_basic', function() {
      if (self.dodgeCooldown > 0) return;
      self.invincible = true;
      self.dodgeCooldown = 1.5;
      if (self.bodyMat) {
        self.bodyMat.emissive = new THREE.Color(0xffffff);
        self.bodyMat.emissiveIntensity = 0.3;
      }
      PluginRegistry.emit('player:dodge', { player: self });
      setTimeout(function() {
        self.invincible = false;
        if (self.bodyMat) {
          self.bodyMat.emissive = new THREE.Color(0x000000);
          self.bodyMat.emissiveIntensity = 0;
        }
      }, 300);
    });
  },

  update(dt) {
    if (!this.mesh) return;

    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;

    // Mouse aiming
    var cam = game.camera;
    if (cam && game.mouse) {
      var vec = new THREE.Vector3(game.mouse.x, game.mouse.y, 0.5);
      vec.unproject(cam);
      var dir = vec.sub(cam.position).normalize();
      var distance = -cam.position.y / dir.y;
      var targetX = cam.position.x + dir.x * distance;
      var targetZ = cam.position.z + dir.z * distance;
      var oldAngle = this.mesh.rotation.y;
      var angle = Math.atan2(targetX - this.mesh.position.x, targetZ - this.mesh.position.z);
      this.mesh.rotation.y = angle;

      if (Math.abs(angle - oldAngle) > 0.01) {
        PluginRegistry.emit('player:aiming', {
          player: this,
          angle: angle,
          targetX: targetX,
          targetZ: targetZ
        });
      }
    }

    var bs = this.bodyScale;
    if (this.mesh.scale.x !== bs) {
      this.mesh.scale.set(bs, bs, bs);
    }

    if (game.input && game.input.shoot) {
      game.shoot(this);
    }
  },

  // ---------- Hasar ----------
  takeDamage: function(amount) {
    if (this.invincible) return;
    this.hp = Math.max(0, this.hp - amount);
    document.getElementById('hpFill').style.width = (this.hp / this.maxHp * 100) + '%';
    PluginRegistry.emit('player:hit', { player: this, damage: amount, hp: this.hp });
    if (this.hp <= 0) {
      this.game.gameOver();
    }
  },

  // ---------- İyileşme ----------
  heal: function(amount) {
    var old = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    document.getElementById('hpFill').style.width = (this.hp / this.maxHp * 100) + '%';
    if (this.hp > old) {
      PluginRegistry.emit('player:heal', { player: this, amount: this.hp - old, hp: this.hp });
    }
  },

  // ---------- XP / Level ----------
  addXp: function(amount) {
    this.xp += amount;
    PluginRegistry.emit('player:xp', { player: this, xp: this.xp, level: this.level });
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.4);
      PluginRegistry.emit('player:levelup', { player: this, level: this.level });
    }
  },

  destroy: function() {
    PluginRegistry.off('player:dodge', this.id);
    if (this.mesh && this.game) {
      this.game.scene.remove(this.mesh);
    }
  }
});
