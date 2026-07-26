var plugin = include('registry');

plugin.register({
  id: 'fx_empty_click',
  name: 'Bos Mermi Sesi',
  type: 'core',
  version: '1.0',
  description: 'Mermi bitince bos click sesi — tetik cekiliyken reload' +
               'bekler, birakinca auto-reload baslar',
  enabled: true,

  _clickCooldown: 0,

  init(game) {
    this._game = game;
    this._clickCooldown = 0;

    plugin.off('game:loaded', this.id + '_snd');
    var self = this;
    plugin.on('game:loaded', this.id + '_snd', function() {
      if (game.sound) {
        game.sound.addSound('empty_click', {
          label: 'Bos Mermi', cat: 'silahlar',
          variants: [{ src: ['audio/empty_click.mp3'], volume: 0.6 }]
        });
      }
    });
  },

  playClick() {
    if (this._clickCooldown > 0) return;
    this._clickCooldown = 0.3;
    if (this._game && this._game.sound) {
      try { this._game.sound.play('empty_click'); } catch (e) {}
    }
  },

  update(dt) {
    if (this._clickCooldown > 0) this._clickCooldown -= dt;
  },

  destroy() {
    plugin.off('game:loaded', this.id + '_snd');
  }
});
