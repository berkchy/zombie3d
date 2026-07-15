function disposeMesh(mesh) {
  mesh.traverse(function(child) {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(function(m) { m.dispose(); });
        else child.material.dispose();
      }
    }
  });
}

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
  weaponBarrelTip: null,
  _weaponSlot: null,

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

    // Silah slot referansini sakla
    this._weaponSlot = group.getObjectByName('weapon_slot');

    // Varsayilan silahi tak (hotbar varsa ilk slot'taki silah kullanilir)
    this.weaponMesh = null;
    this._attachDefaultWeapon();

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

    // Hotbar secimi degisince silah modelini degistir
    PluginRegistry.on('hotbar:select', 'player_basic', function(data) {
      var slotId = data.slot ? data.slot.id : null;
      if (slotId) {
        self._attachWeaponToSlot(slotId);
      } else {
        self._attachWeaponToSlot(null);
      }
    });
  },

  _attachDefaultWeapon() {
    // Hotbar varsa ilk dolu slot'taki silahi kullan, yoksa pistol
    var weaponId = null;
    if (this.game && this.game.hotbar) {
      for (var i = 0; i < 5; i++) {
        var s = this.game.hotbar.getSlot(i);
        if (s && s.id) { weaponId = s.id; break; }
      }
    }
    if (!weaponId) weaponId = 'weapon_pistol';
    this._attachWeaponToSlot(weaponId);
  },

  _attachWeaponToSlot(weaponId) {
    if (!this._weaponSlot) return;

    // Eski silahi kaldir
    if (this.weaponMesh) {
      this._weaponSlot.remove(this.weaponMesh);
      disposeMesh(this.weaponMesh);
      this.weaponMesh = null;
    }
    this.weaponBarrelTip = null;

    if (!weaponId) return;

    // Weapon plugin'ini bul
    var wp = PluginRegistry.get(weaponId);
    if (!wp || !wp.enabled || !wp.modelId) return;

    // Model plugin'ini bul ve olustur
    var mp = PluginRegistry.get(wp.modelId);
    if (!mp || !mp.enabled || typeof mp.createModel !== 'function') return;

    var model;
    try {
      model = mp.createModel();
    } catch (e) {
      return;
    }
    if (!model) return;

    // Boyutu buyut (oyuncu uzerinde daha gorunur olsun)
    model.scale.set(1.8, 1.8, 1.8);

    // Silahi el pozisyonuna uygun sekilde konumlandir
    model.rotation.order = 'YXZ';
    model.rotation.y = 0.15;
    model.rotation.x = -0.1;

    // Namlu ucunu isaretle
    var tip = model.getObjectByName('barrel_tip');
    if (tip) {
      this.weaponBarrelTip = tip;
    }

    this._weaponSlot.add(model);
    this.weaponMesh = model;
  },

  getBarrelWorldPos(target) {
    target = target || new THREE.Vector3();
    if (this.weaponBarrelTip) {
      return this.weaponBarrelTip.getWorldPosition(target);
    }
    target.copy(this.mesh.position).add(new THREE.Vector3(0, 0.4, 0));
    return target;
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
    PluginRegistry.off('hotbar:select', this.id);
    if (this.mesh && this.game) {
      this.game.scene.remove(this.mesh);
    }
  }
});
