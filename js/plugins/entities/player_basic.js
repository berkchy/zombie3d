var plugin = include('registry');
var loader = include('loader');

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

// ===== player_basic =====
plugin.register({
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

  _animId: null,
  _lastAnim: null,

  _modelReady: false,

  init(game) {
    var self = this;
    loader.loadScript('model_player', function(){
      self._initPlayerMesh();
    });

    this.game = game;
    this.hp = this.maxHp;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 50;
    this._modelReady = false;

    if (game.sound) {
      game.sound.addSound('player_hit', {
        randomPlay: true, currentIndex: 0,
        variants: [
          { src: ['audio/player_hit_1.mp3'], volume: 0.7 },
          { src: ['audio/player_hit_2.mp3'], volume: 0.7 }
        ]
      });
    }

    // Placeholder mesh — asil model loadScript ile geldiginde olusturulur
    this.mesh = new THREE.Group();
    this.bodyMesh = null;
    this.headMesh = null;
    this.bodyMat = null;
    this.headMat = null;
    this._weaponSlot = null;
    this.weaponMesh = null;

    game.scene.add(this.mesh);
    game.player = this;
    game.playerMesh = this.mesh;

    // Dodge event — input_manager'dan gelir
    var self = this;
    plugin.on('player:dodge', 'player_basic', function() {
      if (self.dodgeCooldown > 0) return;
      self.invincible = true;
      self.dodgeCooldown = 1.5;
      if (self.bodyMat) {
        self.bodyMat.emissive = new THREE.Color(0xffffff);
        self.bodyMat.emissiveIntensity = 0.3;
      }
      plugin.emit('player:dodge', { player: self });
      setTimeout(function() {
        self.invincible = false;
        if (self.bodyMat) {
          self.bodyMat.emissive = new THREE.Color(0x000000);
          self.bodyMat.emissiveIntensity = 0;
        }
      }, 300);
    });

    // Hotbar secimi degisince silah modelini degistir
    plugin.on('hotbar:select', 'player_basic', function(data) {
      var slotId = data.slot ? data.slot.id : null;
      if (slotId) {
        self._attachWeaponToSlot(slotId);
      } else {
        self._attachWeaponToSlot(null);
      }
    });

    // Hareket animasyonu gecisi
    plugin.on('player:moving', 'player_basic', function(data) {
      var isRun = data.speed > 0.3;
      var target = isRun ? 'run' : 'idle';
      if (self._lastAnim === target) return;
      self._playAnim(target);
    });
  },

  _playAnim(name) {
    try {
      if (this._lastAnim === name) return;
      var anim = plugin.get('core_animation');
      if (!anim || !anim.enabled || !this.mesh) return;
      var modelPlugin = plugin.get('model_player');
      var defs = modelPlugin && modelPlugin.animations ? modelPlugin.animations : null;
      if (!defs || !defs[name]) return;
      if (this._animId && anim.playing && anim.playing[this._animId]) {
        anim.stop(this._animId);
      }
      this._lastAnim = name;
      this._animId = anim.play(this.mesh, defs[name]);
    } catch(e) {
      console.warn('[player_basic] animasyon hatasi:', e.message);
    }
  },

  _attachDefaultWeapon() {
    if (!this.game || !this.game.hotbar) return;
    for (var i = 0; i < 5; i++) {
      var s = this.game.hotbar.getSlot(i);
      if (s && s.id) {
        this._attachWeaponToSlot(s.id);
        return;
      }
    }
    // Hicbir slot dolu degil, silahi kaldir
    this._attachWeaponToSlot(null);
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
    var wp = plugin.get(weaponId);
    if (!wp || !wp.enabled || !wp.modelId) return;

    // Model plugin'ini bul ve olustur
    var mp = plugin.get(wp.modelId);
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

    if (wp.setModelRef) wp.setModelRef(model);
  },

  _initPlayerMesh: function() {
    if (this._modelReady) return;
    var mp = plugin.get('model_player');
    if (!mp || !mp.createModel) return;

    var newMesh = mp.createModel();
    newMesh.position.copy(this.mesh.position);
    newMesh.rotation.copy(this.mesh.rotation);

    this.game.scene.remove(this.mesh);
    this.mesh = newMesh;
    this.game.playerMesh = newMesh;
    this.game.scene.add(newMesh);

    this.bodyMesh = newMesh.getObjectByName('body');
    this.headMesh = newMesh.getObjectByName('head');
    this.bodyMat = newMesh.userData ? newMesh.userData.bodyMat : null;
    this.headMat = newMesh.userData ? newMesh.userData.headMat : null;
    if (this.bodyMat) this.bodyMat.color.setHex(this.color);
    this._weaponSlot = newMesh.getObjectByName('weapon_slot');

    this._modelReady = true;
    this.weaponMesh = null;
    this._attachDefaultWeapon();
    this._playAnim('idle');
  },

  getBarrelWorldPos(target) {
    target = target || new THREE.Vector3();
    if (this.weaponBarrelTip) {
      return this.weaponBarrelTip.getWorldPosition(target);
    }
    if (this.mesh) {
      target.copy(this.mesh.position).add(new THREE.Vector3(0, 0.4, 0));
    }
    return target;
  },

  update(dt) {
    if (!this.mesh) return;

    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;

    // Mouse aiming (sadece third person'da)
    var fp = plugin.get('fx_firstperson');
    if (!(fp && fp.enabled)) {
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
          plugin.emit('player:aiming', {
            player: this,
            angle: angle,
            targetX: targetX,
            targetZ: targetZ
          });
        }
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
    if (this.game && this.game._dying) return;
    if (this.game && this.game.sound) this.game.sound.playAt('player_hit', this.mesh ? this.mesh.position : null);
    this.hp = Math.max(0, this.hp - amount);
    document.getElementById('hpFill').style.width = (this.hp / this.maxHp * 100) + '%';
    plugin.emit('player:hit', { player: this, damage: amount, hp: this.hp });
    if (this.hp <= 0) {
      this._playAnim('die');
      plugin.emit('player:dying', { player: this });
    }
  },

  // ---------- İyileşme ----------
  heal: function(amount) {
    var old = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    document.getElementById('hpFill').style.width = (this.hp / this.maxHp * 100) + '%';
    if (this.hp > old) {
      plugin.emit('player:heal', { player: this, amount: this.hp - old, hp: this.hp });
    }
  },

  // ---------- XP / Level ----------
  addXp: function(amount) {
    this.xp += amount;
    plugin.emit('player:xp', { player: this, xp: this.xp, level: this.level });
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.4);
      plugin.emit('player:levelup', { player: this, level: this.level });
    }
  },

  destroy: function() {
    plugin.off('player:dodge', this.id);
    plugin.off('hotbar:select', this.id);
    plugin.off('player:moving', this.id);
    var anim = plugin.get('core_animation');
    if (anim && anim.enabled && this._animId) {
      anim.stop(this._animId);
      this._animId = null;
    }
    if (this.mesh && this.game) {
      this.game.scene.remove(this.mesh);
    }
  }
});
