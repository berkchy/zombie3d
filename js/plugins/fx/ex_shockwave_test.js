var plugin = include('registry');
var commands = include('commands');

plugin.register({
  id: 'ex_shockwave_test',
  name: 'Shockwave Test',
  type: 'core',
  version: '1.0',
  description: 'shockwave komutu — bakilan konuma dalga olusturur',
  enabled: true,

  init(game) {
    this._game = game;

    commands.register(this.id, 'shockwave', function(args) {
      if (!game.player || !game.scene) return 'Oyuncu veya sahne yok';

      var pos = game.player.mesh.position || { x: 0, y: 0, z: 0 };
      var radius = args[0] ? parseFloat(args[0]) || 3 : 3;
      var duration = args[1] ? parseFloat(args[1]) || 1 : 1;
      var height = args[2] ? parseFloat(args[2]) || 0.4 : 0.4;

      var sw = plugin.get('fx_shockwave');
      if (sw && sw.shockwave) {
        sw.shockwave(pos, {
          maxRadius: radius, duration: duration, height: height,
          color: 0x88ccff, opacity: 0.7
        });
      }

      new WaveThink('cmd_' + Date.now(), {
        duration: duration, maxRadius: radius, position: pos
      });

      return 'Shockwave -> r=' + radius + ' d=' + duration + ' h=' + height;
    });
  },

  destroy() {
    this._game = null;
  }
});