PluginRegistry.register({
  id: 'menu_main',
  name: 'Ana Menü',
  type: 'menu',
  version: '1.0',
  description: 'Oyun ana menüsü',
  priority: 100,

  styles: '.menu-overlay{position:fixed;inset:0;z-index:210;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;transition:opacity .4s ease;}' +
    '.menu-overlay.hidden{opacity:0;pointer-events:none;}' +
    '.menu-overlay .mc{display:flex;flex-direction:column;align-items:center;}' +
    '.menu-overlay h1{font-size:64px;font-weight:300;letter-spacing:8px;color:#fff;margin-bottom:4px;text-transform:uppercase;}' +
    '.menu-overlay h1 em{font-style:normal;color:#c62828;}' +
    '.menu-overlay .sub{font-size:11px;color:rgba(255,255,255,.2);letter-spacing:4px;text-transform:uppercase;margin-bottom:36px;}' +
    '.menu-overlay hr{width:32px;border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:28px;}' +
    '.menu-overlay button{display:block;width:200px;margin:5px 0;padding:12px 0;font-family:inherit;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;border:1px solid rgba(255,255,255,.1);border-radius:4px;background:transparent;color:rgba(255,255,255,.5);cursor:pointer;transition:all .2s;}' +
    '.menu-overlay button:hover{background:rgba(255,255,255,.04);color:rgba(255,255,255,.8);border-color:rgba(255,255,255,.2);}' +
    '.menu-overlay button.primary{border-color:#c62828;color:#fff;background:#c62828;}' +
    '.menu-overlay button.primary:hover{background:#b71c1c;}',

  game: null,
  container: null,
  visible: false,

  init(game) {
    this.game = game;

    var div = document.createElement('div');
    div.className = 'menu-overlay hidden';
    div.innerHTML =
      '<div class="mc">' +
        '<h1><em>Z</em>OMBIE</h1>' +
        '<div class="sub">ölülerin gecesi</div>' +
        '<hr>' +
        '<button class="primary" id="menuPlay">Oyunu Başlat</button>' +
        '<button id="menuModelTest">Model Test Odası</button>' +
        '<button id="menuPlugins">Eklentiler</button>' +
      '</div>';
    document.body.appendChild(div);
    this.container = div;

    document.getElementById('menuPlay').addEventListener('click', function() {
      this.hide();
      PluginRegistry.emit('menu:play');
    }.bind(this));

    document.getElementById('menuModelTest').addEventListener('click', function() {
      this.hide();
      PluginRegistry.emit('menu:model_test');
    }.bind(this));

    document.getElementById('menuPlugins').addEventListener('click', function() {
      document.getElementById('pluginPanel').classList.add('open');
    });

    PluginRegistry.on('intro:done', 'menu_main', function() {
      this.show();
    }.bind(this));

    PluginRegistry.on('game:start', 'menu_main', function() {
      this.hide();
    }.bind(this));

    PluginRegistry.on('game:over', 'menu_main', function() {
      this.show();
    }.bind(this));
  },

  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
      this.visible = true;
    }
  },

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
      this.visible = false;
    }
  },

  destroy() {
    if (this.container) document.body.removeChild(this.container);
    PluginRegistry.off('intro:done', this.id);
    PluginRegistry.off('game:start', this.id);
    PluginRegistry.off('game:over', this.id);
    PluginRegistry.removeStyles(this.id);
  }
});
