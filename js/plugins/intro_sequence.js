PluginRegistry.register({
  id: 'intro_sequence',
  name: 'Giriş Animasyonu',
  type: 'scene',
  version: '1.0',
  description: 'Siteye ilk girince oynayan sinematik intro',
  enabled: true,
  priority: 50,

  styles: '.intro-overlay{position:fixed;inset:0;z-index:215;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000;transition:opacity .8s;}' +
    '.intro-overlay.hidden{opacity:0;pointer-events:none;}' +
    '.intro-line{color:rgba(255,255,255,.7);font-size:16px;letter-spacing:6px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;text-transform:uppercase;opacity:0;animation:introFade 2.5s ease forwards;margin:6px 0;}' +
    '@keyframes introFade{0%{opacity:0;transform:translateY(15px);}20%{opacity:1;transform:translateY(0);}60%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(-15px);}}',

  game: null,
  container: null,
  playing: false,

  init(game) {
    this.game = game;

    var div = document.createElement('div');
    div.className = 'intro-overlay hidden';
    div.innerHTML =
      '<div class="intro-line" style="animation-delay:0s">BİR ZOMBİ SALGINI...</div>' +
      '<div class="intro-line" style="animation-delay:1.5s">İNSANLIĞIN SONU YAKLAŞTI...</div>' +
      '<div class="intro-line" style="animation-delay:3s">TEK BİR HEDEF KALDI: HAYATTA KALMAK</div>';
    document.body.appendChild(div);
    this.container = div;

    PluginRegistry.on('game:loaded', 'intro_sequence', function() {
      this.play();
    }.bind(this));
  },

  play() {
    if (this.playing || !this.container) return;
    this.playing = true;
    this.container.classList.remove('hidden');

    setTimeout(function() {
      this.container.classList.add('hidden');
      this.playing = false;
      PluginRegistry.emit('intro:done');
    }.bind(this), 4500);
  },

  destroy() {
    if (this.container) document.body.removeChild(this.container);
    PluginRegistry.off('game:loaded', this.id);
    PluginRegistry.removeStyles(this.id);
  }
});
