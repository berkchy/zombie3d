var plugin = include('registry');

plugin.register({
  id: 'ui_pause',
  name: 'Duraklatma Ekranı',
  type: 'ui',
  version: '1.0',
  description: 'ESC ile oyunu duraklat',
  enabled: true,
  priority: 100,

  styles: '.pause-overlay{position:fixed;inset:0;z-index:225;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);transition:opacity .25s;}' +
    '.pause-overlay.hidden{opacity:0;pointer-events:none;}' +
    '.pause-box{background:rgba(20,20,30,.95);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:32px 48px;display:flex;flex-direction:column;align-items:center;}' +
    '.pause-box h2{font-size:20px;letter-spacing:4px;color:#eee;font-weight:300;margin-bottom:16px;}' +
    '.pause-box hr{width:24px;border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:20px;}' +
    '.pause-box button{margin:4px 0;padding:10px 48px;width:180px;font-family:inherit;font-size:12px;letter-spacing:1px;text-transform:uppercase;border:1px solid rgba(255,255,255,.1);border-radius:4px;background:transparent;color:rgba(255,255,255,.5);cursor:pointer;transition:all .2s;}' +
    '.pause-box button:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.8);border-color:rgba(255,255,255,.2);}',

  game: null,
  container: null,

  init(game) {
    this.game = game;

    var div = document.createElement('div');
    div.className = 'pause-overlay hidden';
    div.innerHTML =
      '<div class="pause-box">' +
        '<h2>DURAKLATILDI</h2>' +
        '<hr>' +
        '<button id="pauseResume">DEVAM</button>' +
        '<button id="pauseQuit">MENÜ</button>' +
      '</div>';
    document.body.appendChild(div);
    this.container = div;

    plugin.on('game:pause', 'ui_pause', function() {
      this.show();
    }.bind(this));

    plugin.on('game:resume', 'ui_pause', function() {
      this.hide();
    }.bind(this));

    plugin.on('game:start', 'ui_pause', function() {
      this.hide();
    }.bind(this));

    document.getElementById('pauseResume').addEventListener('click', function() {
      if (game) game.resume();
    });

    document.getElementById('pauseQuit').addEventListener('click', function() {
      if (game) {
        game.resume();
        game.gameOver();
      }
    });
  },

  show() {
    if (this.container) this.container.classList.remove('hidden');
  },

  hide() {
    if (this.container) this.container.classList.add('hidden');
  },

  destroy() {
    if (this.container) document.body.removeChild(this.container);
    plugin.off('game:pause', this.id);
    plugin.off('game:resume', this.id);
    plugin.off('game:start', this.id);
    plugin.removeStyles(this.id);
  }
});
