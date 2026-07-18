var plugin = window.include('registry');
var map = window.include('map');

plugin.register({
  id: 'menu_main',
  name: 'Ana Menü',
  type: 'menu',
  version: '3.1',
  description: 'Oyun ana menüsü + harita seçimi',
  priority: 100,

  styles: '.menu-overlay{position:fixed;inset:0;z-index:210;background:rgba(10,10,10,0.8);color:#fff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;transition:opacity .4s ease;}' +
    '.menu-overlay.hidden{opacity:0;pointer-events:none;}' +
    '.menu-overlay .menu-view{display:flex;flex-direction:column;width:100%;height:100%;position:absolute;inset:0;opacity:0;transform:translateY(12px);transition:all .35s ease;pointer-events:none;}' +
    '.menu-overlay .menu-view.active{opacity:1;transform:translateY(0);pointer-events:auto;}' +
    '#mv-main{justify-content:center;padding-left:clamp(40px,10vw,120px);}' +
    '#mv-main .mm-title{font-size:clamp(56px,7vw,96px);font-family:\'Fjalla One\',sans-serif;font-weight:400;letter-spacing:4px;color:#fff;text-transform:uppercase;margin:0;line-height:1;}' +
    '#mv-main .mm-title em{font-style:normal;color:#c62828;font-weight:400;}' +
    '#mv-main .mm-sub{font-size:clamp(13px,1.4vw,16px);color:rgba(255,255,255,.25);letter-spacing:5px;text-transform:uppercase;margin-top:8px;font-weight:700;}' +
    '#mv-main .mm-divider{width:40px;height:1px;background:rgba(255,255,255,.08);border:none;margin:28px 0;}' +
    '#mv-main .mm-btn{display:block;background:none;border:none;padding:10px 0;font-family:inherit;font-size:clamp(12px,1.3vw,14px);letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.3);cursor:pointer;transition:all .25s;text-align:left;}' +
    '#mv-main .mm-btn:hover{color:#fff;transform:translateX(6px);}' +
    '#mv-main .mm-btn.primary{color:#c62828;}' +
    '#mv-main .mm-btn.primary:hover{color:#ef5350;}' +
    '#mv-maps{padding:20px clamp(20px,4vw,60px);}' +
    '#mv-maps .mv-top{display:flex;align-items:center;padding:4px 0 16px;flex-shrink:0;}' +
    '#mv-maps .mv-top .mb-back{background:none;border:none;color:rgba(255,255,255,.3);font-family:inherit;font-size:13px;letter-spacing:1px;cursor:pointer;padding:8px 12px;transition:color .2s,transform .2s;border-radius:4px;}' +
    '#mv-maps .mv-top .mb-back:hover{color:#fff;background:rgba(255,255,255,.04);transform:translateX(-3px);}' +
    '#mv-maps .mv-body{flex:1;overflow-y:auto;padding:4px 0;}' +
    '#mv-maps .mv-body::-webkit-scrollbar{width:4px;}' +
    '#mv-maps .mv-body::-webkit-scrollbar-track{background:transparent;}' +
    '#mv-maps .mv-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px;}' +
    '#mv-maps .mv-bottom{display:flex;justify-content:flex-end;padding:16px 0 4px;flex-shrink:0;}' +
    '#mv-maps .mv-bottom .mb-enter{background:#c62828;border:none;color:#fff;font-family:inherit;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:12px 32px;border-radius:4px;cursor:pointer;transition:background .2s,transform .2s,opacity .2s;}' +
    '#mv-maps .mv-bottom .mb-enter:hover{background:#b71c1c;transform:scale(1.03);}' +
    '#mv-maps .mv-bottom .mb-enter:active{transform:scale(.97);}' +
    '#mv-maps .mv-bottom .mb-enter:disabled{background:rgba(255,255,255,.05);color:rgba(255,255,255,.15);cursor:default;transform:none;}' +
    '.map-entry{display:flex;gap:16px;padding:10px;border:1px solid rgba(255,255,255,.06);border-radius:8px;cursor:pointer;transition:all .25s ease;background:rgba(255,255,255,.02);margin-bottom:10px;transform:scale(1);}' +
    '.map-entry:hover{border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.04);transform:scale(1.01);}' +
    '.map-entry:active{transform:scale(.99);}' +
    '.map-entry.selected{border-color:#c62828;background:rgba(198,40,40,.06);box-shadow:0 0 24px rgba(198,40,40,.06);}' +
    '.map-entry.selected:hover{transform:scale(1.01);}' +
    '.map-entry .me-thumb{width:clamp(120px,16vw,200px);aspect-ratio:4/3;border-radius:4px;background:#12121e;overflow:hidden;flex-shrink:0;}' +
    '.map-entry .me-thumb img{width:100%;height:100%;object-fit:cover;display:block;}' +
    '.map-entry .me-thumb .met-load{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.12);letter-spacing:1px;}' +
    '.map-entry .me-info{flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;}' +
    '.map-entry .me-info .mei-name{font-size:clamp(14px,1.5vw,18px);color:#fff;letter-spacing:.5px;}' +
    '.map-entry .me-info .mei-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}' +
    '.map-entry .me-info .mei-mode{font-size:clamp(10px,1vw,12px);padding:2px 10px;border-radius:3px;text-transform:uppercase;letter-spacing:1.5px;font-weight:500;}' +
    '.map-entry .me-info .mei-mode.normal{background:rgba(76,175,80,.12);color:#4caf50;}' +
    '.map-entry .me-info .mei-mode.polygon{background:rgba(79,195,247,.12);color:#4fc3f7;}' +
    '.map-entry .me-info .mei-desc{font-size:clamp(11px,1.1vw,13px);color:rgba(255,255,255,.3);letter-spacing:.3px;}' +
    '.empty-maps{width:100%;text-align:center;padding:80px 20px;color:rgba(255,255,255,.2);font-size:13px;letter-spacing:1px;}' +
    '.empty-maps strong{display:block;font-size:16px;color:rgba(255,255,255,.4);margin-bottom:6px;}',

  game: null,
  container: null,
  visible: false,
  _selectedMapId: null,

  init(game) {
    this.game = game;
    this._selectedMapId = null;

    if (game.sound) {
      game.sound.addSound('ui_click', {
        spatial: false,
        variants: [{ src: ['audio/ui_click.mp3'], volume: 0.3 }]
      });
      game.sound.addSound('menu_music', {
        spatial: false,
        variants: [{ src: ['audio/menu_music.mp3'], loop: true, volume: game.sound._musicVol }],
        music: true
      });
    }

    var self = this;

    plugin.on('intro:done', this.id, function() {
      if (game.sound) {
        if (!game.sound._bank || !game.sound._bank['menu_music']) {
          game.sound.addSound('menu_music', {
            variants: [{ src: ['audio/menu_music.mp3'], loop: true, volume: game.sound._musicVol }],
            music: true
          });
        }
        game.sound.fadeIn('menu_music', 800);
      }
    });
    plugin.on('menu:play', this.id, function() {
      if (game.sound) game.sound.fadeOut('menu_music', 500);
    });
    plugin.on('game:over', this.id, function() {
      if (game.sound) {
        if (!game.sound._bank || !game.sound._bank['menu_music']) {
          game.sound.addSound('menu_music', {
            variants: [{ src: ['audio/menu_music.mp3'], loop: true, volume: game.sound._musicVol }],
            music: true
          });
        }
        game.sound.fadeIn('menu_music', 800);
      }
    });

    var div = document.createElement('div');
    div.className = 'menu-overlay hidden';
    div.innerHTML =
      '<div class="menu-view" id="mv-main">' +
        '<div class="mm-title"><em>D</em>EADWAKE</div>' +
        '<div class="mm-sub">NIGHT OF THE RAVENING</div>' +
        '<hr class="mm-divider">' +
        '<button class="mm-btn primary" id="menuPlay">Oyunu Başlat</button>' +
        '<button class="mm-btn" id="menuModelTest">Model Test Odası</button>' +
        '<button class="mm-btn" id="menuPlugins">Eklentiler</button>' +
      '</div>' +
      '<div class="menu-view" id="mv-maps">' +
        '<div class="mv-top"><button class="mb-back" id="mapBack">← Geri</button></div>' +
        '<div class="mv-body" id="mapList"></div>' +
        '<div class="mv-bottom"><button class="mb-enter" id="mapEnter">Haritaya Gir</button></div>' +
      '</div>';
    document.body.appendChild(div);
    this.container = div;

    document.getElementById('menuPlay').addEventListener('click', function() {
      self._playClick();
      this._showMaps();
    }.bind(this));

    document.getElementById('menuModelTest').addEventListener('click', function() {
      self._playClick();
      this.hide();
      plugin.emit('menu:model_test');
    }.bind(this));

    document.getElementById('menuPlugins').addEventListener('click', function() {
      self._playClick();
      document.getElementById('pluginPanel').classList.add('open');
    });

    document.getElementById('mapBack').addEventListener('click', function() {
      self._playClick();
      this._showMain();
    }.bind(this));

    document.getElementById('mapEnter').addEventListener('click', function() {
      self._playClick();
      if (!this._selectedMapId) return;
      this.container.style.display = 'none';
      this.visible = false;
      plugin.emit('menu:play', { mapId: this._selectedMapId });
    }.bind(this));

    plugin.on('intro:done', 'menu_main', function() {
      this.show();
    }.bind(this));

    plugin.on('game:start', 'menu_main', function() {
      this.hide();
    }.bind(this));

    plugin.on('game:over', 'menu_main', function() {
      this._selectedMapId = null;
      this._showMain();
      this.show();
    }.bind(this));
  },

  _playClick: function() {
    if (!this.game || !this.game.sound) return;
    var s = this.game.sound;
    if (!s._bank || !s._bank['ui_click']) {
      s.addSound('ui_click', {
        spatial: false,
        variants: [{ src: ['audio/ui_click.mp3'], volume: 0.3 }]
      });
    }
    s.play('ui_click');
  },

  _showMain: function() {
    var mvMain = document.getElementById('mv-main');
    var mvMaps = document.getElementById('mv-maps');
    if (mvMain) mvMain.classList.add('active');
    if (mvMaps) mvMaps.classList.remove('active');
  },

  _showMaps: function() {
    var mvMain = document.getElementById('mv-main');
    var mvMaps = document.getElementById('mv-maps');
    if (mvMain) mvMain.classList.remove('active');
    if (mvMaps) mvMaps.classList.add('active');
    this._selectedMapId = null;
    this._renderMapList();
  },

  _renderMapList: function() {
    var list = document.getElementById('mapList');
    if (!list) return;

    var enterBtn = document.getElementById('mapEnter');
    var maps = map.getAll();

    if (maps.length === 0) {
      list.innerHTML = '<div class="empty-maps"><strong>Harita yok</strong>Oyuna harita ekleyin</div>';
      if (enterBtn) enterBtn.disabled = true;
      return;
    }

    if (enterBtn) enterBtn.disabled = false;

    var self = this;
    list.innerHTML = '';
    maps.forEach(function(def) {
      var entry = document.createElement('div');
      entry.className = 'map-entry';
      entry.dataset.mapId = def.id;

      var modeClass = def.mode === 'polygon' ? 'polygon' : 'normal';
      var modeLabel = def.mode === 'polygon' ? 'POLIGON' : 'NORMAL';

      entry.innerHTML =
        '<div class="me-thumb" id="thumb-' + def.id + '">' +
          '<div class="met-load">YÜKLENİYOR</div>' +
        '</div>' +
        '<div class="me-info">' +
          '<div class="mei-name">' + (def.name || def.id) + '</div>' +
          '<div class="mei-row">' +
            '<span class="mei-mode ' + modeClass + '">' + modeLabel + '</span>' +
            '<span class="mei-desc">' + (def.modeDescription || '') + '</span>' +
          '</div>' +
        '</div>';

      entry.addEventListener('click', function() {
        self._playClick();
        var prev = list.querySelector('.map-entry.selected');
        if (prev) prev.classList.remove('selected');
        entry.classList.add('selected');
        self._selectedMapId = def.id;
      });

      list.appendChild(entry);

      map.renderThumbnail(def.id, 200, 150, function(url) {
        var thumb = document.getElementById('thumb-' + def.id);
        if (thumb && url) {
          thumb.innerHTML = '<img src="' + url + '" alt="' + (def.name || def.id) + '">';
        } else if (thumb) {
          thumb.innerHTML = '<div class="met-load">—</div>';
        }
      });
    });

    var first = list.querySelector('.map-entry');
    if (first) {
      first.classList.add('selected');
      self._selectedMapId = maps[0].id;
    }
  },

  show() {
    if (this.container) {
      this._showMain();
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
    plugin.off('intro:done', this.id);
    plugin.off('menu:play', this.id);
    plugin.off('game:start', this.id);
    plugin.off('game:over', this.id);
    plugin.removeStyles(this.id);
  }
});
