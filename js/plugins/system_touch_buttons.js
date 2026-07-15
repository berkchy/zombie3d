PluginRegistry.register({
  id: 'system_touch_buttons',
  name: 'Touch Buton Sistemi',
  type: 'core',
  version: '1.1',
  description: 'Mobil dokunmatik buton yonetimi — ekle/sil/duzenle/konumlandir/ozellestir',
  enabled: true,
  priority: 60,

  _buttons: {},
  _editMode: false,
  _game: null,
  _savedPositions: {},
  _origDisplays: {},
  _editing: null,

  styles:
    '#touch-settings-btn{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:300;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.45);border:2px solid rgba(255,255,255,.15);color:#fff;font-size:18px;cursor:pointer;display:none;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;touch-action:manipulation;}' +
    '#touch-settings-btn:active{background:rgba(79,195,247,.35);}' +
    '#touch-edit-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:290;background:rgba(0,0,0,.55);display:none;touch-action:none;}' +
    '#touch-edit-save{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);z-index:296;padding:12px 44px;background:#2e7d32;color:#fff;border:none;border-radius:8px;font-family:monospace;font-size:16px;font-weight:bold;cursor:pointer;letter-spacing:2px;display:none;pointer-events:auto;box-shadow:0 2px 12px rgba(0,0,0,.4);}' +
    '#touch-edit-save:active{background:#1b5e20;}' +
    '#touch-edit-close{position:fixed;top:12px;right:14px;z-index:296;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:15px;cursor:pointer;display:none;align-items:center;justify-content:center;pointer-events:auto;}' +
    '#touch-edit-close:active{background:rgba(244,67,54,.3);}' +
    '#touch-edit-info{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:296;color:rgba(255,255,255,.6);font-family:monospace;font-size:12px;display:none;pointer-events:none;text-shadow:0 1px 6px rgba(0,0,0,.6);letter-spacing:1px;}' +
    '.touch-btn{position:fixed;z-index:200;cursor:default;touch-action:none;user-select:none;-webkit-user-select:none;display:flex;align-items:center;justify-content:center;text-align:center;font-family:monospace;font-weight:bold;background:radial-gradient(circle at 40% 35%,rgba(255,255,255,0.15),rgba(255,255,255,0.03));box-shadow:0 0 20px rgba(0,0,0,0.2);}' +
    '.touch-btn-edit{border:2px dashed rgba(33,150,243,.7)!important;background:rgba(33,150,243,.12)!important;cursor:grab!important;}' +
    '.touch-btn-edit:active{cursor:grabbing!important;}' +
    '.touch-btn-hidden-edit{opacity:.25!important;filter:grayscale(1)!important;}' +
    '.touch-btn-hidden-edit .tbtn-hidden-label{display:block!important;}' +
    '.touch-btn-pencil{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:11px;cursor:pointer!important;display:flex;align-items:center;justify-content:center;z-index:293;pointer-events:auto;}' +
    '.touch-btn-pencil:active{background:rgba(33,150,243,.6);}' +
    '.tbtn-hidden-label{display:none!important;position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);font-size:8px;color:rgba(255,255,255,.5);font-family:monospace;white-space:nowrap;pointer-events:none;}' +
    '#touch-editor-panel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:300;width:300px;background:rgba(20,20,30,.95);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:0;display:none;font-family:monospace;font-size:13px;color:#ddd;box-shadow:0 8px 40px rgba(0,0,0,.6);pointer-events:auto;}' +
    '#touch-editor-panel .ep-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,0,0,.3);border-bottom:1px solid rgba(255,255,255,.08);border-radius:12px 12px 0 0;font-weight:bold;color:#fff;font-size:14px;}' +
    '#touch-editor-panel .ep-close{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.08);border:none;color:#aaa;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;}' +
    '#touch-editor-panel .ep-close:active{background:rgba(244,67,54,.3);color:#f44336;}' +
    '#touch-editor-panel .ep-body{padding:14px 16px 18px;}' +
    '#touch-editor-panel .ep-row{display:flex;align-items:center;margin-bottom:10px;}' +
    '#touch-editor-panel .ep-label{width:70px;font-size:12px;color:rgba(255,255,255,.5);flex-shrink:0;}' +
    '#touch-editor-panel .ep-input{flex:1;}' +
    '#touch-editor-panel input[type="text"]{width:100%;padding:5px 8px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);border-radius:4px;color:#fff;font-family:monospace;font-size:12px;outline:none;box-sizing:border-box;}' +
    '#touch-editor-panel input[type="text"]:focus{border-color:rgba(33,150,243,.5);}' +
    '#touch-editor-panel input[type="range"]{width:100%;height:4px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,.15);border-radius:2px;outline:none;}' +
    '#touch-editor-panel input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#42a5f5;cursor:pointer;border:none;}' +
    '#touch-editor-panel input[type="range"]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#42a5f5;cursor:pointer;border:none;}' +
    '#touch-editor-panel .ep-range-val{min-width:28px;text-align:right;font-size:11px;color:rgba(255,255,255,.4);margin-left:8px;}' +
    '#touch-editor-panel .ep-check{display:flex;align-items:center;gap:8px;}' +
    '#touch-editor-panel .ep-check input[type="checkbox"]{-webkit-appearance:none;appearance:none;width:36px;height:20px;background:rgba(255,255,255,.12);border-radius:10px;position:relative;cursor:pointer;border:none;outline:none;flex-shrink:0;}' +
    '#touch-editor-panel .ep-check input[type="checkbox"]::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#888;transition:.2s;}' +
    '#touch-editor-panel .ep-check input[type="checkbox"]:checked{background:rgba(46,125,50,.5);}' +
    '#touch-editor-panel .ep-check input[type="checkbox"]:checked::after{left:18px;background:#4caf50;}' +
    '#touch-editor-panel .ep-color-wrap{display:flex;align-items:center;gap:8px;}' +
    '#touch-editor-panel input[type="color"]{width:32px;height:28px;padding:0;border:1px solid rgba(255,255,255,.15);border-radius:4px;background:transparent;cursor:pointer;}' +
    '#touch-editor-panel .ep-color-text{font-size:11px;color:rgba(255,255,255,.35);font-family:monospace;}',

  init: function(game) {
    this._game = game;
    this._createUI();
    this._loadPositions();
    this._gearBtn.style.display = 'flex';

    this.touchAdd('fire', {
      label: 'ATES',
      html: '<svg viewBox="0 0 40 40" width="28" height="28"><circle cx="20" cy="20" r="6" fill="#fff" opacity=".9"/><line x1="20" y1="4" x2="20" y2="14" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/><line x1="20" y1="26" x2="20" y2="36" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/><line x1="4" y1="20" x2="14" y2="20" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/><line x1="26" y1="20" x2="36" y2="20" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/></svg>',
      x: 85, y: 78,
      width: 72, height: 72,
      shape: 'circle',
      bgColor: 'rgba(244,67,54,.55)',
      color: '#fff',
      fontSize: 13,
      zIndex: 200,
      onTouchStart: function() {
        if (game) game.input.shoot = true;
      },
      onTouchEnd: function() {
        if (game) game.input.shoot = false;
      }
    });

    this.touchAdd('reload', {
      label: 'RELOAD',
      html: '<svg viewBox="0 0 40 40" width="24" height="24"><path d="M20 8a12 12 0 1 0 8.5 3.5" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><polyline points="20,2 26,8 20,14" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      x: 87, y: 65,
      width: 68, height: 68,
      shape: 'circle',
      bgColor: 'rgba(0,0,0,.5)',
      color: '#fff',
      fontSize: 11,
      zIndex: 200,
      onClick: function() {
        var rl = PluginRegistry.get('system_reload');
        if (rl && rl._startReload) rl._startReload();
      }
    });

    var self = this;
    PluginRegistry.on('game:start', this.id, function() {
      self._gearBtn.style.display = 'flex';
      self._updateVisibility();
    });
    PluginRegistry.on('game:over', this.id, function() {
      self._gearBtn.style.display = 'none';
      self._updateVisibility();
    });
    PluginRegistry.on('game:restart', this.id, function() {
      self._gearBtn.style.display = 'flex';
      self._updateVisibility();
    });
  },

  _createUI: function() {
    var self = this;

    var gear = document.createElement('div');
    gear.id = 'touch-settings-btn';
    gear.textContent = '\u2699';
    gear.addEventListener('click', function(e) { e.stopPropagation(); self._toggleEdit(); });
    gear.addEventListener('touchstart', function(e) { e.stopPropagation(); });
    document.body.appendChild(gear);
    this._gearBtn = gear;

    var overlay = document.createElement('div');
    overlay.id = 'touch-edit-overlay';
    overlay.addEventListener('touchstart', function(e) { e.stopPropagation(); });
    document.body.appendChild(overlay);
    this._overlay = overlay;

    var info = document.createElement('div');
    info.id = 'touch-edit-info';
    info.textContent = 'BUTONLARI SURUKLEYIN | KALEM ILE OZELLESTIRIN';
    document.body.appendChild(info);
    this._info = info;

    var save = document.createElement('div');
    save.id = 'touch-edit-save';
    save.textContent = 'KAYDET';
    save.addEventListener('click', function(e) { e.stopPropagation(); self._exitEdit(true); });
    save.addEventListener('touchstart', function(e) { e.stopPropagation(); });
    document.body.appendChild(save);
    this._saveBtn = save;

    var close = document.createElement('div');
    close.id = 'touch-edit-close';
    close.textContent = '\u2715';
    close.addEventListener('click', function(e) { e.stopPropagation(); self._exitEdit(false); });
    close.addEventListener('touchstart', function(e) { e.stopPropagation(); });
    document.body.appendChild(close);
    this._closeBtn = close;

    // Editor panel
    var panel = document.createElement('div');
    panel.id = 'touch-editor-panel';
    panel.innerHTML =
      '<div class="ep-header"><span id="ep-title">Buton</span><button class="ep-close" id="ep-close-btn">\u2715</button></div>' +
      '<div class="ep-body">' +
        '<div class="ep-row"><div class="ep-label">Isim</div><div class="ep-input"><input type="text" id="ep-label-input"></div></div>' +
        '<div class="ep-row"><div class="ep-label">Genislik</div><div class="ep-input ep-check"><input type="range" id="ep-width-range" min="40" max="140" value="60"><span class="ep-range-val" id="ep-width-val">60</span></div></div>' +
        '<div class="ep-row"><div class="ep-label">Yukseklik</div><div class="ep-input ep-check"><input type="range" id="ep-height-range" min="40" max="140" value="60"><span class="ep-range-val" id="ep-height-val">60</span></div></div>' +
        '<div class="ep-row"><div class="ep-label">Renk</div><div class="ep-input ep-color-wrap"><input type="color" id="ep-color-picker"><span class="ep-color-text" id="ep-color-text">#ffffff</span></div></div>' +
        '<div class="ep-row"><div class="ep-label">Opaklik</div><div class="ep-input ep-check"><input type="range" id="ep-alpha-range" min="0" max="100" value="80"><span class="ep-range-val" id="ep-alpha-val">0.8</span></div></div>' +
        '<div class="ep-row"><div class="ep-label">Gizle</div><div class="ep-input ep-check"><input type="checkbox" id="ep-hidden-check"> Goster/Gizle</div></div>' +
      '</div>';
    panel.addEventListener('touchstart', function(e) { e.stopPropagation(); });
    document.body.appendChild(panel);
    this._panel = panel;

    document.getElementById('ep-close-btn').addEventListener('click', function() { self._closeEditor(); });
    document.getElementById('ep-close-btn').addEventListener('touchstart', function(e) { e.stopPropagation(); });

    document.getElementById('ep-label-input').addEventListener('input', function() { self._applyEditor(); });
    document.getElementById('ep-width-range').addEventListener('input', function() {
      document.getElementById('ep-width-val').textContent = this.value;
      self._applyEditor();
    });
    document.getElementById('ep-height-range').addEventListener('input', function() {
      document.getElementById('ep-height-val').textContent = this.value;
      self._applyEditor();
    });
    document.getElementById('ep-color-picker').addEventListener('input', function() {
      document.getElementById('ep-color-text').textContent = this.value;
      self._applyEditor();
    });
    document.getElementById('ep-alpha-range').addEventListener('input', function() {
      document.getElementById('ep-alpha-val').textContent = (this.value / 100).toFixed(1);
      self._applyEditor();
    });
    document.getElementById('ep-hidden-check').addEventListener('change', function() { self._applyEditor(); });
  },

  _openEditor: function(id) {
    var btn = this._buttons[id];
    if (!btn) return;
    this._editing = id;

    document.getElementById('ep-title').textContent = 'Buton: ' + (btn.label || id);
    document.getElementById('ep-label-input').value = btn.label || '';
    document.getElementById('ep-width-range').value = btn.width;
    document.getElementById('ep-width-val').textContent = btn.width;
    document.getElementById('ep-height-range').value = btn.height;
    document.getElementById('ep-height-val').textContent = btn.height;

    var color = btn.bgColor;
    var alpha = 0.8;
    var hexColor = '#ffffff';
    var match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      hexColor = '#' + [match[1], match[2], match[3]].map(function(v) {
        return ('0' + parseInt(v).toString(16)).slice(-2);
      }).join('');
      alpha = match[4] != null ? parseFloat(match[4]) : 1;
    } else if (color.match(/^#[0-9a-fA-F]{6}/)) {
      hexColor = color.substring(0, 7);
    }
    document.getElementById('ep-color-picker').value = hexColor;
    document.getElementById('ep-color-text').textContent = hexColor;
    document.getElementById('ep-alpha-range').value = Math.round(alpha * 100);
    document.getElementById('ep-alpha-val').textContent = alpha.toFixed(1);
    document.getElementById('ep-hidden-check').checked = !!btn.hidden;

    this._panel.style.display = 'block';
  },

  _closeEditor: function() {
    this._panel.style.display = 'none';
    this._editing = null;
  },

  _applyEditor: function() {
    var id = this._editing;
    if (!id) return;
    var btn = this._buttons[id];
    if (!btn) return;

    var label = document.getElementById('ep-label-input').value || btn.id;
    var w = parseInt(document.getElementById('ep-width-range').value);
    var h = parseInt(document.getElementById('ep-height-range').value);
    var hex = document.getElementById('ep-color-picker').value;
    var alpha = parseInt(document.getElementById('ep-alpha-range').value) / 100;
    var hidden = document.getElementById('ep-hidden-check').checked;

    this.touchEdit(id, {
      label: label,
      width: w,
      height: h,
      bgColor: hex.startsWith('#') ? hex : ('#' + hex),
      alpha: alpha,
      hidden: hidden
    });
  },

  _updateVisibility: function() {
    var g = this._game;
    var hide = !g || !window.gameStarted || g.gameOverFlag;
    if (this._editMode) return;
    for (var id in this._buttons) {
      var btn = this._buttons[id];
      if (!btn._el) continue;
      if (btn._external) {
        btn._el.style.display = hide ? 'none' : (btn._origDisplay || 'block');
      } else {
        btn._el.style.display = (hide || btn.hidden) ? 'none' : 'flex';
      }
    }
  },

  // ─── Public API ────────────────────────────────────────

  touchAdd: function(id, config) {
    if (this._buttons[id]) this.touchRemove(id);

    var saved = this._savedPositions[id] || null;
    var btn = {
      id: id,
      label: (saved && saved.label) ? saved.label : (config.label || id),
      html: config.html || null,
      x: saved ? saved.x : (config.x != null ? config.x : 50),
      y: saved ? saved.y : (config.y != null ? config.y : 50),
      width: (saved && saved.width) ? saved.width : (config.width || 60),
      height: (saved && saved.height) ? saved.height : (config.height || 60),
      shape: config.shape || 'circle',
      bgColor: (saved && saved.bgColor) ? saved.bgColor : (config.bgColor || 'rgba(255,255,255,.2)'),
      color: config.color || '#fff',
      fontSize: config.fontSize || 12,
      alpha: (saved && saved.alpha != null) ? saved.alpha : (config.alpha != null ? config.alpha : 1),
      border: config.border || '1px solid rgba(255,255,255,.15)',
      zIndex: config.zIndex || 200,
      onClick: typeof config.onClick === 'function' ? config.onClick : null,
      onTouchStart: typeof config.onTouchStart === 'function' ? config.onTouchStart : null,
      onTouchEnd: typeof config.onTouchEnd === 'function' ? config.onTouchEnd : null,
      hidden: (saved && saved.hidden != null) ? saved.hidden : (config.hidden || false),
      _el: null,
      _external: !!config.element
    };

    if (config.element) {
      btn._el = config.element;
      btn._origDisplay = config.element.style.display || 'block';
      this._applyStyle(config.element, btn);
      this._attachEditDrag(btn);
    } else {
      this._createElement(btn);
    }

    this._buttons[id] = btn;
    this._updateVisibility();
    return btn;
  },

  touchRemove: function(id) {
    var btn = this._buttons[id];
    if (!btn) return;
    if (!btn._external && btn._el && btn._el.parentNode) {
      btn._el.parentNode.removeChild(btn._el);
    }
    delete this._buttons[id];
  },

  touchEdit: function(id, config) {
    var btn = this._buttons[id];
    if (!btn) return;
    if (config.x != null) btn.x = config.x;
    if (config.y != null) btn.y = config.y;
    if (config.label != null) btn.label = config.label;
    if (config.width != null) btn.width = config.width;
    if (config.height != null) btn.height = config.height;
    if (config.shape != null) btn.shape = config.shape;
    if (config.bgColor != null) btn.bgColor = config.bgColor;
    if (config.color != null) btn.color = config.color;
    if (config.fontSize != null) btn.fontSize = config.fontSize;
    if (config.alpha != null) btn.alpha = config.alpha;
    if (config.border != null) btn.border = config.border;
    if (config.html != null) btn.html = config.html;
    if (config.onClick != null) btn.onClick = config.onClick;
    if (config.onTouchStart != null) btn.onTouchStart = config.onTouchStart;
    if (config.onTouchEnd != null) btn.onTouchEnd = config.onTouchEnd;
    if (config.hidden != null) btn.hidden = config.hidden;
    this._updateElement(btn);
    if (this._editMode) this._updateEditHidden(btn);
    this._updateVisibility();
  },

  // ─── Internal ──────────────────────────────────────────

  _createElement: function(btn) {
    if (btn._el) return;
    var self = this;
    var el = document.createElement('div');
    el.className = 'touch-btn';
    el.id = 'tbtn-' + btn.id;
    if (btn.html) el.innerHTML = btn.html;
    else el.textContent = btn.label;
    this._applyStyle(el, btn);
    el.style.display = btn.hidden ? 'none' : 'flex';

    el.addEventListener('touchstart', function(e) {
      e.stopPropagation();
      if (self._editMode) { self._startDrag(e, btn.id); return; }
      if (btn.onTouchStart) btn.onTouchStart(e);
    }, {passive: true});

    el.addEventListener('touchend', function(e) {
      e.stopPropagation();
      if (self._editMode) return;
      if (btn.onTouchEnd) btn.onTouchEnd(e);
    });

    el.addEventListener('click', function(e) {
      if (self._editMode) return;
      if (btn.onClick) btn.onClick(e);
    });

    el.addEventListener('mousedown', function(e) {
      if (self._editMode) { self._startDrag(e, btn.id); }
    });

    document.body.appendChild(el);
    btn._el = el;
  },

  _attachEditDrag: function(btn) {
    if (!btn._el) return;
    var self = this;
    var el = btn._el;

    el.addEventListener('touchstart', function(e) {
      if (!self._editMode) return;
      e.stopPropagation();
      e.preventDefault();
      self._startDrag(e, btn.id);
    }, {passive: false});

    el.addEventListener('mousedown', function(e) {
      if (!self._editMode) return;
      self._startDrag(e, btn.id);
    });
  },

  _applyStyle: function(el, btn) {
    if (btn._external) {
      el.style.position = 'fixed';
      el.style.left = btn.x + '%';
      el.style.top = btn.y + '%';
      el.style.width = btn.width + 'px';
      el.style.height = btn.height + 'px';
      el.style.zIndex = btn.zIndex;
      el.style.transform = 'translate(-50%,-50%)';
      return;
    }
    var r = btn.shape === 'circle' ? '50%' : '8px';
    el.style.cssText = [
      'left:' + btn.x + '%;',
      'top:' + btn.y + '%;',
      'width:' + btn.width + 'px;',
      'height:' + btn.height + 'px;',
      'background:' + btn.bgColor + ';',
      'color:' + btn.color + ';',
      'font-size:' + btn.fontSize + 'px;',
      'z-index:' + btn.zIndex + ';',
      'border-radius:' + r + ';',
      'border:' + btn.border + ';',
      'opacity:' + btn.alpha + ';',
      'transform:translate(-50%,-50%);'
    ].join('');
  },

  _updateElement: function(btn) {
    if (!btn._el) return;
    this._applyStyle(btn._el, btn);
    if (!btn._external) {
      if (btn.html) btn._el.innerHTML = btn.html;
      else btn._el.textContent = btn.label;
    }
  },

  _updateEditHidden: function(btn) {
    if (!btn._el) return;
    if (btn.hidden) {
      btn._el.classList.add('touch-btn-hidden-edit');
      if (!btn._el.querySelector('.tbtn-hidden-label')) {
        var hl = document.createElement('span');
        hl.className = 'tbtn-hidden-label';
        hl.textContent = '(GIZLI)';
        btn._el.appendChild(hl);
      }
    } else {
      btn._el.classList.remove('touch-btn-hidden-edit');
      var hl = btn._el.querySelector('.tbtn-hidden-label');
      if (hl) hl.parentNode.removeChild(hl);
    }
  },

  _toggleEdit: function() {
    this._editMode ? this._exitEdit(false) : this._enterEdit();
  },

  _enterEdit: function() {
    var self = this;
    this._editMode = true;
    this._overlay.style.display = 'block';
    this._saveBtn.style.display = 'block';
    this._closeBtn.style.display = 'flex';
    this._info.style.display = 'block';
    if (this._gearBtn) this._gearBtn.style.display = 'none';
    this._origDisplays = {};

    for (var id in this._buttons) {
      var btn = this._buttons[id];
      if (!btn._el) continue;
      btn._el.classList.add('touch-btn-edit');
      this._origDisplays[id] = btn._el.style.display;
      btn._el.style.display = 'flex';
      btn._el.style.zIndex = 292;

      this._updateEditHidden(btn);

      var pencil = btn._el.querySelector('.touch-btn-pencil');
      if (!pencil) {
        pencil = document.createElement('div');
        pencil.className = 'touch-btn-pencil';
        pencil.textContent = '\u270E';
        (function(bid) {
          pencil.addEventListener('mousedown', function(e) { e.stopPropagation(); });
          pencil.addEventListener('click', function(e) { e.stopPropagation(); self._openEditor(bid); });
          pencil.addEventListener('touchstart', function(e) { e.stopPropagation(); self._openEditor(bid); });
        })(id);
        btn._el.appendChild(pencil);
      }
    }
  },

  _exitEdit: function(save) {
    this._closeEditor();

    if (save) {
      this._savePositions();
    } else {
      this._loadPositions();
      for (var id in this._buttons) {
        var saved = this._savedPositions[id];
        if (saved) {
          this._buttons[id].x = saved.x;
          this._buttons[id].y = saved.y;
        }
        this._updateElement(this._buttons[id]);
      }
    }

    this._editMode = false;
    this._overlay.style.display = 'none';
    this._saveBtn.style.display = 'none';
    this._closeBtn.style.display = 'none';
    this._info.style.display = 'none';
    if (this._gearBtn) this._gearBtn.style.display = 'flex';

    for (var id in this._buttons) {
      var btn = this._buttons[id];
      if (!btn._el) continue;
      btn._el.classList.remove('touch-btn-edit');
      btn._el.classList.remove('touch-btn-hidden-edit');
      var pencil = btn._el.querySelector('.touch-btn-pencil');
      if (pencil) pencil.parentNode.removeChild(pencil);
      var hl = btn._el.querySelector('.tbtn-hidden-label');
      if (hl) hl.parentNode.removeChild(hl);
      var orig = this._origDisplays[id];
      if (btn._external) {
        this._applyStyle(btn._el, btn);
        btn._el.style.zIndex = btn.zIndex;
        btn._el.style.display = orig || btn._origDisplay || 'block';
      } else {
        this._applyStyle(btn._el, btn);
        btn._el.style.display = (btn.hidden) ? 'none' : 'flex';
      }
    }
    this._origDisplays = {};

    this._updateVisibility();
  },

  _startDrag: function(e, id) {
    e.preventDefault();
    var pos = this._getPos(e);
    var btn = this._buttons[id];
    if (!btn || !btn._el) return;

    this._drag = {
      id: id,
      ox: pos.x - (btn.x / 100 * window.innerWidth),
      oy: pos.y - (btn.y / 100 * window.innerHeight)
    };

    var self = this;
    this._drag._move = function(e) { self._onDrag(e); };
    this._drag._end = function(e) { self._endDrag(e); };
    document.addEventListener('mousemove', this._drag._move);
    document.addEventListener('mouseup', this._drag._end);
    document.addEventListener('touchmove', this._drag._move, {passive: false});
    document.addEventListener('touchend', this._drag._end);
  },

  _onDrag: function(e) {
    if (!this._drag) return;
    e.preventDefault();
    var pos = this._getPos(e);
    var btn = this._buttons[this._drag.id];
    if (!btn) return;

    btn.x = Math.max(2, Math.min(98, (pos.x - this._drag.ox) / window.innerWidth * 100));
    btn.y = Math.max(2, Math.min(98, (pos.y - this._drag.oy) / window.innerHeight * 100));
    this._updateElement(btn);
  },

  _endDrag: function(e) {
    if (!this._drag) return;
    document.removeEventListener('mousemove', this._drag._move);
    document.removeEventListener('mouseup', this._drag._end);
    document.removeEventListener('touchmove', this._drag._move);
    document.removeEventListener('touchend', this._drag._end);
    this._drag = null;
  },

  _getPos: function(e) {
    if (e.changedTouches) return {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY};
    if (e.touches) return {x: e.touches[0].clientX, y: e.touches[0].clientY};
    return {x: e.clientX, y: e.clientY};
  },

  _savePositions: function() {
    var data = {};
    for (var id in this._buttons) {
      var b = this._buttons[id];
      data[id] = {x: b.x, y: b.y, width: b.width, height: b.height, bgColor: b.bgColor, alpha: b.alpha, hidden: b.hidden, label: b.label};
    }
    try { localStorage.setItem('touch_buttons_positions', JSON.stringify(data)); } catch(e) {}
  },

  _loadPositions: function() {
    this._savedPositions = {};
    try {
      var raw = localStorage.getItem('touch_buttons_positions');
      if (raw) {
        var data = JSON.parse(raw);
        for (var id in data) {
          this._savedPositions[id] = data[id];
        }
      }
    } catch(e) {}
  },

  destroy: function() {
    this._closeEditor();
    for (var id in this._buttons) this.touchRemove(id);
    var ids = ['touch-settings-btn','touch-edit-overlay','touch-edit-info','touch-edit-save','touch-edit-close','touch-editor-panel'];
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    PluginRegistry.off('game:start', this.id);
    PluginRegistry.off('game:over', this.id);
    PluginRegistry.off('game:restart', this.id);
  }
});
