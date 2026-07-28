var plugin = include('registry');
var cvar = include('cvar');
var commands = include('commands');

plugin.register({
  id: 'fx_slowmo',
  name: 'Yavaslatma (Slow Motion)',
  type: 'graphics',
  version: '1.0',
  description: 'Zaman yavaslatma + matrix efekti',

  init() {
    cvar.register('slowmo', 0, 'number', 'Slow-motion aktif (0/1)');
    cvar.register('slowmo_speed', 0.3, 'number', 'Hiz carpani (0.05-1.0)');
    cvar.register('slowmo_amount', 0.5, 'number', 'Gorsel efekt siddeti (0-1)');

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
        cvar.set('slowmo', args[0] === '1' ? 1 : 0);
        return 'Slow-motion: ' + (cvar.get('slowmo') ? 'ON' : 'OFF');
      });
    }
  },

  update(dt) {
    if (!cvar.get('slowmo')) {
      window._timeScale = 1;
      return;
    }
    var speed = Math.max(0.05, Math.min(1.0, parseFloat(cvar.get('slowmo_speed')) || 0.3));
    window._timeScale = speed;
  },

  destroy() {
    window._timeScale = 1;
    if (commands) commands.unregister('slowmo');
  }
});
