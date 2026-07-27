var plugin = include('registry');
var commands = include('commands');
var cvar = include('cvar');

plugin.register({
  id: 'fx_flashlight',
  name: 'El Feneri',
  type: 'graphics',
  version: '1.0',
  description: 'F tusu ile acilip kapanan el feneri',
  priority: 15,

  _on: false,
  _light: null,

  init() {
    cvar.register('flashlight_intensity', 1.0, 'number', 'Fener parlakligi (0.5 - 3.0)');
    cvar.register('flashlight_range', 25, 'number', 'Fener menzili (5 - 50)');
    cvar.register('flashlight_angle', 25, 'number', 'Fener acisi (5 - 60)');

    if (!window.game || !window.game.camera) return;

    var g = window.game;
    this._light = new THREE.SpotLight(0xffeedd, cvar.get('flashlight_intensity'), cvar.get('flashlight_range'), THREE.MathUtils.degToRad(cvar.get('flashlight_angle')), 0.6, 1.5);
    this._light.position.set(0, 0, 0);
    this._light.target.position.set(0, 0, -5);
    g.camera.add(this._light);
    g.camera.add(this._light.target);
    g._flashlight = this;
    this._light.visible = false;

    var self = this;

    commands.register('fx_flashlight', 'flashlight', function(args) {
      self._toggle();
      return 'El feneri ' + (self._on ? 'acildi' : 'kapatildi');
    }, 'El fenerini ac/kapa');

    this._keyHandler = function(e) {
      if (e.key === 'f' || e.key === 'F') {
        if (window.game && window.game._consoleOpen) return;
        self._toggle();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  },

  _toggle() {
    this._on = !this._on;
    if (this._light) {
      this._light.visible = this._on;
      this._light.intensity = cvar.get('flashlight_intensity');
    }
  },

  update(dt) {
    if (!this._light || !this._on) return;
    var i = cvar.get('flashlight_intensity');
    if (this._light.intensity !== i) this._light.intensity = i;
  },

  destroy() {
    document.removeEventListener('keydown', this._keyHandler);
    commands.unregisterAll('fx_flashlight');
    if (this._light && this._light.parent) this._light.parent.remove(this._light);
    if (this._light && this._light.target && this._light.target.parent) this._light.target.parent.remove(this._light.target);
  }
});
