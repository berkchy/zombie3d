var plugin = include('registry');
var cvar = include('cvar');
var commands = include('commands');

plugin.register({
  id: 'fx_slowmo',
  name: 'Yavaslatma (Slow Motion)',
  type: 'graphics',
  version: '1.0',
  description: 'Zombi oldurunce zaman yavaslar, geri hizlanir',

  _timer: 0,
  _duration: 0,
  _active: false,

  init() {
    var self = this;

    cvar.register('slowmo', 1, 'number', 'Slow-motion aktif (0/1)');
    cvar.register('slowmo_speed', 0.15, 'number', 'Yavaslama hiz carpani (0.05-1.0)');
    cvar.register('slowmo_amount', 0.5, 'number', 'Gorsel efekt siddeti (0-1)');
    cvar.register('slowmo_duration', 1.0, 'number', 'Yavaslama suresi (saniye)');

    plugin.on('zombie:die', this.id, function() { self._trigger(); });
    plugin.on('boss:die', this.id, function() { self._trigger(1.5); });

    if (commands) {
      commands.register('slowmo', 'fx', function(args) {
        if (args.length === 0) {
          var cur = cvar.get('slowmo');
          cvar.set('slowmo', cur ? 0 : 1);
          return 'Slow-motion: ' + (cur ? 'OFF' : 'ON');
        }
        if (args[0] === 'speed' && args[1]) {
          cvar.set('slowmo_speed', parseFloat(args[1]));
          return 'Slow-motion hizi: ' + cvar.get('slowmo_speed');
        }
        if (args[0] === 'amount' && args[1]) {
          cvar.set('slowmo_amount', parseFloat(args[1]));
          return 'Slow-motion efekt: ' + cvar.get('slowmo_amount');
        }
        if (args[0] === 'dur' && args[1]) {
          cvar.set('slowmo_duration', parseFloat(args[1]));
          return 'Slow-motion sure: ' + cvar.get('slowmo_duration');
        }
        cvar.set('slowmo', args[0] === '1' ? 1 : 0);
        return 'Slow-motion: ' + (cvar.get('slowmo') ? 'ON' : 'OFF');
      });
    }
  },

  _trigger(dur) {
    if (!cvar.get('slowmo')) return;
    this._duration = dur || parseFloat(cvar.get('slowmo_duration')) || 1.0;
    this._timer = this._duration;
    this._active = true;
  },

  update(dt) {
    if (!cvar.get('slowmo')) {
      window._timeScale = 1;
      window._slowMoEffect = 0;
      this._active = false;
      return;
    }

    if (!this._active) {
      window._timeScale = 1;
      window._slowMoEffect = 0;
      return;
    }

    this._timer -= dt;
    if (this._timer <= 0) {
      this._active = false;
      window._timeScale = 1;
      window._slowMoEffect = 0;
      return;
    }

    var t = Math.max(0, this._timer / this._duration);
    var eased = 1 - Math.pow(1 - t, 3);
    var target = Math.max(0.05, Math.min(1.0, parseFloat(cvar.get('slowmo_speed')) || 0.15));
    window._timeScale = target + (1 - target) * eased;
    window._slowMoEffect = (1 - eased) * (parseFloat(cvar.get('slowmo_amount')) || 0.5);
  },

  destroy() {
    window._timeScale = 1;
    window._slowMoEffect = 0;
    plugin.off('zombie:die', this.id);
    plugin.off('boss:die', this.id);
    if (commands) commands.unregister('slowmo');
  }
});
