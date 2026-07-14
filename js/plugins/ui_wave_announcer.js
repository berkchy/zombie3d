PluginRegistry.register({
  id: 'ui_wave_announcer',
  name: 'Dalga Anonsu',
  version: '1.0',
  type: 'ui',
  description: 'Dalga değişiminde ekran uyarısı',
  enabled: true,

  styles: '.wave-popup{position:fixed;top:35%;left:50%;transform:translate(-50%,-50%);color:#ff6f00;font-family:monospace;font-size:28px;font-weight:bold;text-shadow:0 0 15px #ff6f00,0 0 30px #ff6f00;z-index:160;pointer-events:none;animation:waveAnim 2s forwards;}',

  init(game) {
    var self = this;
    PluginRegistry.on('wave:change', this.id, function(data) {
      self.showWave(data.newWave);
    });
  },

  showWave: function(wave) {
    var el = document.createElement('div');
    el.className = 'wave-popup';
    el.textContent = 'DALGA ' + wave;
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 2100);
  },

  destroy() {
    PluginRegistry.off('wave:change', this.id);
    PluginRegistry.removeStyles(this.id);
  }
});
