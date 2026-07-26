var plugin = include('registry');

plugin.register({
  id: 'test_classes',
  name: 'Test Siniflari',
  type: 'core',
  version: '2.0',
  enabled: true,
  priority: 0,

  _hasZoom: false,
  _hasArmor: false,
  _hasDoubleJump: false,
  _extraJumps: 0,
  _wasOnGround: true,
  _aiming: false,

  init() {
    var sc = plugin.get('system_class');
    if (!sc) return;

    sc.register('asker', {
      name: 'Asker',
      modelId: 'model_player',
      description: 'Dengeli sinif, her duruma uygun',
      hp: 100,
      speed: 1.0,
      gravity: 1.0,
      abilities: []
    });

    sc.register('sniper', {
      name: 'Keskin Nisanci',
      modelId: 'model_player',
      description: 'Dusuk can, yuksek isabet',
      hp: 80,
      speed: 0.9,
      gravity: 1.0,
      abilities: ['zoom']
    });

    sc.register('heavy', {
      name: 'Agir Sinif',
      modelId: 'model_player',
      description: 'Yuksek can, yavas hareket',
      hp: 200,
      speed: 0.7,
      gravity: 1.3,
      abilities: ['armor']
    });

    sc.register('scout', {
      name: 'Izci',
      modelId: 'model_player',
      description: 'Hizli, ziplamaci, dusuk can',
      hp: 70,
      speed: 1.4,
      gravity: 0.8,
      abilities: ['double_jump']
    });

    var self = this;

    plugin.on('class:selected', this.id, function(data) {
      var abils = data.abilities || [];
      self._hasZoom = abils.indexOf('zoom') !== -1;
      self._hasArmor = abils.indexOf('armor') !== -1;
      self._hasDoubleJump = abils.indexOf('double_jump') !== -1;
      self._extraJumps = 0;
    });

    plugin.on('player:takeDamage', this.id, function(ev) {
      if (self._hasArmor) ev.damage *= 0.5;
    });

    plugin.on('player:jumpPress', this.id, function(data) {
      if (!self._hasDoubleJump) return;
      var pm = plugin.get('player_movement');
      if (!pm) return;

      if (data.wasOnGround) {
        self._extraJumps = 1;
      } else if (self._extraJumps > 0) {
        pm.velocityY = pm.jumpForce;
        self._extraJumps--;
      }
    });

    this._onMouseDown = function(e) {
      if (e.button === 2) self._aiming = true;
    };
    this._onMouseUp = function(e) {
      if (e.button === 2) self._aiming = false;
    };
    this._onCtx = function(e) { e.preventDefault(); };
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('contextmenu', this._onCtx);
  },

  update(dt) {
    var pm = plugin.get('player_movement');
    if (!pm || !game || !game.player) return;

    if (this._hasDoubleJump) {
      if (pm.onGround) this._extraJumps = this._wasOnGround ? this._extraJumps : 0;
      this._wasOnGround = pm.onGround;
    }

    if (this._hasZoom) {
      var hfov = window._targetHfov || 60;
      if (this._aiming) hfov *= 0.45;
      var aspect = window.innerWidth / window.innerHeight;
      if (window.camera) {
        window.camera.aspect = aspect;
        var vfov = 2 * Math.atan(Math.tan(hfov * Math.PI / 360) / aspect) * 180 / Math.PI;
        window.camera.fov = vfov;
        window.camera.updateProjectionMatrix();
      }
    }
  },

  destroy() {
    plugin.off('class:selected', this.id);
    plugin.off('player:takeDamage', this.id);
    plugin.off('player:jumpPress', this.id);
    document.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('contextmenu', this._onCtx);
  }
});
