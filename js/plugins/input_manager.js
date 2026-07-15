PluginRegistry.register({
  id: 'input_manager',
  name: 'Giriş Yöneticisi',
  type: 'player',
  version: '1.0',
  description: 'Klavye/fare girdilerini yönetir',
  priority: 1,
  enabled: true,

  game: null,
  _keys: null,

  init(game) {
    this.game = game;
    game.input = { x: 0, y: 0, shoot: false, _kbx: 0, _kby: 0, _joyx: 0, _joyy: 0 };
    game.mouse = { x: 0, y: 0 };
    this._keys = { w: false, a: false, s: false, d: false };
    var self = this;

    document.addEventListener('keydown', function(e) {
      var k = e.key.toLowerCase();
      if (k in self._keys) { self._keys[k] = true; e.preventDefault(); }
      if (k === ' ') { game.input.shoot = true; e.preventDefault(); }
      if (e.key === 'Shift') {
        PluginRegistry.emit('player:dodge', { source: 'input_manager' });
      }
    });
    document.addEventListener('keyup', function(e) {
      var k = e.key.toLowerCase();
      if (k in self._keys) self._keys[k] = false;
      if (k === ' ') game.input.shoot = false;
    });
    document.addEventListener('mousedown', function(e) {
      if (e.button === 0) game.input.shoot = true;
    });
    document.addEventListener('mouseup', function(e) {
      if (e.button === 0) game.input.shoot = false;
    });
    document.addEventListener('mousemove', function(e) {
      game.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      game.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    document.addEventListener('touchstart', function(e) {
      if (e.target && e.target.closest && e.target.closest('#joystick-area')) return;
      var touch = e.changedTouches[0];
      if (touch) {
        game.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        game.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      }
    }, { passive: true });
    document.addEventListener('touchmove', function(e) {
      for (var i = 0; i < e.touches.length; i++) {
        var touch = e.touches[i];
        var el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.closest && el.closest('#joystick-area')) continue;
        game.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        game.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        return;
      }
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
      // sadece mouse aim guncellemesi, shoot touch tusu uzerinden
    }, { passive: true });
    document.addEventListener('touchcancel', function() {
      // shoot touch tusu uzerinden yonetilir
    }, { passive: true });
  },

  update() {
    var keys = this._keys;
    game.input._kbx = 0;
    game.input._kby = 0;
    if (keys.w) game.input._kby = -1;
    if (keys.s) game.input._kby = 1;
    if (keys.a) game.input._kbx = -1;
    if (keys.d) game.input._kbx = 1;
    if (game.input._kbx !== 0 && game.input._kby !== 0) {
      game.input._kbx *= 0.707;
      game.input._kby *= 0.707;
    }
    // Keyboard overrides joystick when active
    game.input.x = game.input._kbx !== 0 ? game.input._kbx : game.input._joyx;
    game.input.y = game.input._kby !== 0 ? game.input._kby : game.input._joyy;
  }
});
