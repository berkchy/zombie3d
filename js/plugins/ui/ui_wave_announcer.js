var plugin = include('registry');

plugin.register({
  id: 'ui_wave_announcer',
  name: 'Dalga Anonsu',
  version: '2.0',
  type: 'ui',
  description: 'Dalga değişiminde kayar animasyon',
  enabled: true,

  styles:
    '@keyframes waveSlide{0%{transform:translateX(-100vw);}38%{transform:translateX(-50%);}52%{transform:translateX(-50%);}100%{transform:translateX(100vw);}}' +
    '.wu-announce{position:fixed;top:32%;left:50%;z-index:160;pointer-events:none;white-space:nowrap;display:flex;align-items:baseline;gap:14px;animation:waveSlide 5s cubic-bezier(0.4,0,0.2,1) forwards;}' +
    '.wu-a-label{font-size:22px;color:#fff;font-weight:300;letter-spacing:4px;}' +
    '.wu-a-number{font-size:30px;color:#fff;font-weight:700;position:relative;top:3px;}',

  init(game) {
    var self = this;
    plugin.on('wave:change', this.id, function(data) {
      self.showWave(data.newWave);
    });
  },

  showWave: function(wave) {
    var el = document.createElement('div');
    el.className = 'wu-announce';
    el.innerHTML = '<span class="wu-a-label">DALGA</span><span class="wu-a-number">' + wave + '</span>';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 5500);
  },

  destroy() {
    plugin.off('wave:change', this.id);
    plugin.removeStyles(this.id);
  }
});
