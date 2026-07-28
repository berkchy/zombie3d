var plugin = window.include('registry');
var map = window.include('map');

plugin.register({
  id: 'menu_main',
  name: 'Ana Menü',
  type: 'menu',
  version: '3.1',
  description: 'Oyun ana menüsü + harita seçimi',
  priority: 100,

  styles: '.menu-overlay{position:fixed;inset:0;z-index:210;background:rgba(10,10,10,0.6);color:#fff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;transition:opacity .4s ease;}' +
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
    '#mv-maps{padding:0;display:flex;flex-direction:column;}' +
    '#mv-maps .mv-top{display:flex;align-items:center;padding:14px clamp(20px,4vw,50px);flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.04);}' +
    '#mv-maps .mv-top h2{color:#fff;font-size:16px;letter-spacing:3px;text-transform:uppercase;margin:0 0 0 14px;font-weight:400;}' +
    '#mv-maps .mv-top .mb-back{background:none;border:none;color:rgba(255,255,255,.3);font-family:inherit;font-size:13px;letter-spacing:1px;cursor:pointer;padding:8px 10px;transition:all .2s;border-radius:4px;line-height:1;}' +
    '#mv-maps .mv-top .mb-back:hover{color:#fff;background:rgba(255,255,255,.04);}' +
    '#mv-maps .mv-body{flex:1;overflow-y:auto;padding:20px clamp(20px,4vw,50px);display:flex;flex-wrap:wrap;gap:16px;justify-content:center;align-content:flex-start;}' +
    '#mv-maps .mv-body::-webkit-scrollbar{width:4px;}' +
    '#mv-maps .mv-body::-webkit-scrollbar-track{background:transparent;}' +
    '#mv-maps .mv-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px;}' +
    '#mv-maps .mv-bottom{display:flex;justify-content:center;padding:16px clamp(20px,4vw,50px);flex-shrink:0;border-top:1px solid rgba(255,255,255,.04);}' +
    '#mv-maps .mv-bottom .mb-enter{background:#c62828;border:none;color:#fff;font-family:inherit;font-size:14px;letter-spacing:2px;text-transform:uppercase;padding:14px 48px;border-radius:8px;cursor:pointer;transition:all .25s;}' +
    '#mv-maps .mv-bottom .mb-enter:hover{background:#b71c1c;transform:scale(1.03);box-shadow:0 4px 20px rgba(198,40,40,.25);}' +
    '#mv-maps .mv-bottom .mb-enter:active{transform:scale(.97);}' +
    '#mv-maps .mv-bottom .mb-enter:disabled{background:rgba(255,255,255,.05);color:rgba(255,255,255,.15);cursor:default;transform:none;box-shadow:none;}' +
    '.map-entry{width:100%;max-width:600px;display:flex;flex-direction:row;overflow:hidden;cursor:pointer;transition:all .25s ease;border:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.35);}' +
    '.map-entry:hover{transform:translateX(6px);border-color:rgba(255,255,255,.14);box-shadow:0 8px 30px rgba(0,0,0,.4);}' +
    '.map-entry:active{transform:translateX(3px);}' +
    '.map-entry.selected{border-color:#c62828;box-shadow:0 0 25px rgba(198,40,40,.1),0 8px 30px rgba(0,0,0,.4);}' +
    '.map-entry .me-thumb{width:140px;height:105px;flex-shrink:0;overflow:hidden;background:#0d0d16;border-right:1px solid rgba(255,255,255,.04);}' +
    '.map-entry .me-thumb img{width:100%;height:100%;object-fit:cover;display:block;}' +
    '.map-entry .me-thumb .met-load{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:9px;color:rgba(255,255,255,.1);letter-spacing:1px;font-family:monospace;}' +
    '.map-entry .me-body{flex:1;padding:14px 18px;display:flex;flex-direction:column;justify-content:center;min-width:0;}' +
    '.map-entry .me-body .me-name{font-family:\'Fjalla One\',sans-serif;font-size:20px;color:#fff;letter-spacing:1px;line-height:1.2;margin-bottom:4px;}' +
    '.map-entry .me-body .me-desc{font-family:\'Rajdhani\',sans-serif;font-size:13px;color:rgba(255,255,255,.35);line-height:1.3;letter-spacing:.3px;margin-bottom:10px;}' +
    '.map-entry .me-body .me-footer{display:flex;align-items:center;gap:12px;margin-top:auto;}' +
    '.map-entry .me-body .me-mode{font-family:\'Rajdhani\',sans-serif;font-size:11px;font-weight:700;padding:2px 12px;border-radius:3px;text-transform:uppercase;letter-spacing:2px;background:rgba(255,255,255,.05);}' +
    '.map-entry .me-body .me-mode.normal{color:#4caf50;border:1px solid rgba(76,175,80,.2);}' +
    '.map-entry .me-body .me-mode.polygon{color:#4fc3f7;border:1px solid rgba(79,195,247,.2);}' +
    '.map-entry .me-body .me-mode.empty{color:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.1);}' +
    '.map-entry .me-body .me-stars{font-family:\'Rajdhani\',sans-serif;font-size:13px;color:rgba(255,255,255,.08);letter-spacing:2px;margin-left:auto;}' +
    '.map-entry .me-body .me-stars .on{color:#ffa726;}' +
    '.empty-maps{width:100%;text-align:center;padding:80px 20px;color:rgba(255,255,255,.2);font-size:13px;letter-spacing:1px;}' +
    '.empty-maps strong{display:block;font-size:16px;color:rgba(255,255,255,.4);margin-bottom:6px;}',

  game: null,
  container: null,
  visible: false,
  _selectedMapId: null,
  _titleHTML: '<em>D</em>EADWAKE',
  _crazyTimer: null,
  _crazyInterval: null,
  _corruptInterval: null,
  _crazy: false,
  _thumbRefreshTimer: null,

  init(game) {
    this.game = game;
    this._selectedMapId = null;

    if (game.sound) {
      game.sound.addSound('ui_click', {
        spatial: false, label: 'UI Tıklama', cat: 'arayuz',
        variants: [{ src: ['audio/ui_click.mp3'], volume: 0.3 }]
      });
      game.sound.addSound('menu_music', {
        spatial: false, label: 'Menü Müziği', cat: 'muzik',
        variants: [
          { src: ['audio/menu_music_1.mp3'], loop: true, volume: game.sound._musicVol },
          { src: ['audio/menu_music_2.mp3'], loop: true, volume: game.sound._musicVol },
          { src: ['audio/menu_music_3.mp3'], loop: true, volume: game.sound._musicVol },
          { src: ['audio/menu_music_4.mp3'], loop: true, volume: game.sound._musicVol },
          { src: ['audio/menu_music_5.mp3'], loop: true, volume: game.sound._musicVol },
          { src: ['audio/menu_music_6.mp3'], loop: true, volume: game.sound._musicVol }
        ],
        music: true
      });
    }

    var self = this;

    plugin.on('intro:done', this.id, function() {
      if (game.sound) {
        if (!game.sound._bank || !game.sound._bank['menu_music']) {
          game.sound.addSound('menu_music', {
            spatial: false, label: 'Menü Müziği', cat: 'muzik',
            variants: [
              { src: ['audio/menu_music_1.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_2.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_3.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_4.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_5.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_6.mp3'], loop: true, volume: game.sound._musicVol }
            ],
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
            spatial: false, label: 'Menü Müziği', cat: 'muzik',
            variants: [
              { src: ['audio/menu_music_1.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_2.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_3.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_4.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_5.mp3'], loop: true, volume: game.sound._musicVol },
              { src: ['audio/menu_music_6.mp3'], loop: true, volume: game.sound._musicVol }
            ],
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
        '<button class="mm-btn" id="menuMapCreator">Harita Oluştur</button>' +
        '<button class="mm-btn" id="menuSoundSettings">Ses Ayarları</button>' +
        '<button class="mm-btn" id="menuExit">Çıkış</button>' +
      '</div>' +
      '<div class="menu-view" id="mv-maps">' +
        '<div class="mv-top"><button class="mb-back" id="mapBack">← Geri</button><h2>Harita Seç</h2></div>' +
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
      self.hide();
      plugin.emit('menu:model_test');
    }.bind(this));

    document.getElementById('menuMapCreator').addEventListener('click', function() {
      self._playClick();
      self.hide();
      plugin.emit('menu:map_creator');
    });

    document.getElementById('menuSoundSettings').addEventListener('click', function() {
      self._playClick();
      self.hide();
      var evt = new CustomEvent('soundSettings:open');
      document.dispatchEvent(evt);
    });

    document.getElementById('menuExit').addEventListener('click', function() {
      self._playClick();
      var cd = include('confirm_dialog');
      cd.show({
        title: 'Çıkmak İstediğinize Emin Misiniz?',
        subText: 'Oyundan çıkmak üzeresiniz. İşleminiz geri alınamaz.',
        buttons: [
          { label: 'İptal', value: false },
          { label: 'Çık', value: true, primary: true }
        ]
      }, function(result) {
        if (result) {
          crashGame('menu_main', 'exit', new Error('The game has been terminated successfully. Goodbye.'));
        }
      });
    });

    document.getElementById('mapBack').addEventListener('click', function() {
      self._playClick();
      this._showMain();
    }.bind(this));

    document.getElementById('mapEnter').addEventListener('click', function() {
      self._playClick();
      if (!this._selectedMapId) return;
      var sc = plugin.get('system_class');
      if (sc && sc._classes && Object.keys(sc._classes).length > 0) {
        sc.show(function(selected) {
          sc._apply(selected);
          self.container.style.display = 'none';
          self.visible = false;
          plugin.emit('menu:play', { mapId: self._selectedMapId });
        });
      } else {
        this.container.style.display = 'none';
        this.visible = false;
        plugin.emit('menu:play', { mapId: this._selectedMapId });
      }
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

    plugin.on('menu:return', 'menu_main', function() {
      this._showMain();
      this.show();
    }.bind(this));
  },

  _playClick: function() {
    if (!this.game || !this.game.sound) return;
    var s = this.game.sound;
    if (!s._bank || !s._bank['ui_click']) {
      s.addSound('ui_click', {
        spatial: false, label: 'UI Tıklama', cat: 'arayuz',
        variants: [{ src: ['audio/ui_click.mp3'], volume: 0.3 }]
      });
    }
    s.play('ui_click');
  },

  _resetTitle() {
    var el = document.querySelector('.mm-title');
    if (!el) return;
    el.innerHTML = this._titleHTML;
    el.style.transform = '';
    el.style.color = '';
    el.style.letterSpacing = '';
  },

  _scrambleHTML(html) {
    var symbols = '!@#$%^&*+={}[]|;:,.<>?/~`0123456789';
    var out = '';
    var inTag = false;
    for (var i = 0; i < html.length; i++) {
      var c = html[i];
      if (c === '<') { inTag = true; out += c; continue; }
      if (c === '>') { inTag = false; out += c; continue; }
      if (inTag) { out += c; continue; }
      if (Math.random() < 0.35) { out += symbols[Math.floor(Math.random() * symbols.length)]; }
      else { out += c; }
    }
    return out;
  },

  _startCrazy() {
    if (this._crazy) return;
    this._crazy = true;
    var el = document.querySelector('.mm-title');
    if (!el) return;
    var self = this;
    var phase = 0;
    var origHTML = this._titleHTML;

    this._crazyInterval = setInterval(function() {
      phase++;
      var sx = (Math.random() - 0.5) * 14;
      var sy = (Math.random() - 0.5) * 6;
      var rot = (Math.random() - 0.5) * 3;
      var scale = 1 + Math.sin(phase * 0.15) * 0.1;
      el.style.transform = 'translate(' + sx + 'px,' + sy + 'px) rotate(' + rot + 'deg) scale(' + scale + ')';
      var colors = ['#fff','#ff2222','#cc0000','#ff4444','#ff6600','#ff0000','#ffffff','#ff1111'];
      el.style.color = colors[phase % colors.length];
      if (phase % 4 === 0) el.style.letterSpacing = (Math.random() * 6 + 1) + 'px';
    }, 50);

    this._corruptInterval = setInterval(function() {
      if (!el) return;
      el.innerHTML = self._scrambleHTML(origHTML);
      setTimeout(function() { if (el) el.innerHTML = origHTML; }, 180);
    }, 700);
  },

  _stopCrazy() {
    if (this._crazyTimer) { clearTimeout(this._crazyTimer); this._crazyTimer = null; }
    if (this._crazyInterval) { clearInterval(this._crazyInterval); this._crazyInterval = null; }
    if (this._corruptInterval) { clearInterval(this._corruptInterval); this._corruptInterval = null; }
    this._crazy = false;
    this._resetTitle();
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
    // 500ms sonra thumbnail'leri yenile (modeller tam yüklenmiş olur)
    var self = this;
    if (this._thumbRefreshTimer) clearTimeout(this._thumbRefreshTimer);
    this._thumbRefreshTimer = setTimeout(function() {
      self._thumbRefreshTimer = null;
      self._renderMapList();
    }, 500);
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
    map.clearThumbnails();
    maps.forEach(function(def) {
      var entry = document.createElement('div');
      entry.className = 'map-entry';
      entry.dataset.mapId = def.id;

      var modeClass = def.mode || 'normal';
      var modeLabel = (def.mode || 'normal').toUpperCase();

      var diffStars = def.difficulty || (def.mode === 'polygon' ? 1 : def.mode === 'empty' ? 0 : 3);
      var starsHtml = '';
      for (var si = 0; si < 3; si++) {
        starsHtml += '<span class="' + (si < diffStars ? 'on' : '') + '">★</span>';
      }

      entry.innerHTML =
        '<div class="me-thumb" id="thumb-' + def.id + '"><div class="met-load">YÜKLENİYOR</div></div>' +
        '<div class="me-body">' +
          '<div class="me-name">' + (def.name || def.id) + '</div>' +
          '<div class="me-desc">' + (def.modeDescription || '') + '</div>' +
          '<div class="me-footer">' +
            '<span class="me-mode ' + modeClass + '">' + modeLabel + '</span>' +
            '<span class="me-stars">' + starsHtml + '</span>' +
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

      map.renderThumbnail(def.id, 280, 210, function(url) {
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
      this._stopCrazy();
      this._resetTitle();
      this._showMain();
      this.container.classList.remove('hidden');
      this.visible = true;
      var self = this;
      this._crazyTimer = setTimeout(function() { self._startCrazy(); }, 30000);
    }
  },

  hide() {
    this._stopCrazy();
    if (this.container) {
      this.container.classList.add('hidden');
      this.visible = false;
    }
  },

  destroy() {
    if (this._thumbRefreshTimer) { clearTimeout(this._thumbRefreshTimer); this._thumbRefreshTimer = null; }
    if (this.container) document.body.removeChild(this.container);
    plugin.off('intro:done', this.id);
    plugin.off('menu:play', this.id);
    plugin.off('game:start', this.id);
    plugin.off('game:over', this.id);
    plugin.off('menu:return', this.id);
    plugin.removeStyles(this.id);
  }
});
