var plugin = include('registry');

plugin.register({
  id: 'system_class',
  name: 'Sinif Sistemi',
  type: 'core',
  version: '2.0',
  description: 'Sinif kayit, secim ekrani, property yonetimi',
  enabled: true,
  priority: 90,

  _classes: {},
  _selectedId: null,
  _el: null,
  _gridEl: null,
  _resolve: null,
  _selectedCard: null,

  styles:
    '#class-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:300;background:rgba(8,8,18,0.95);display:none;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;backdrop-filter:blur(4px);}' +
    '#class-header{text-align:center;margin-bottom:28px;}' +
    '#class-header .ctitle{color:#fff;font-size:24px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;}' +
    '#class-header .csub{color:rgba(255,255,255,0.2);font-size:12px;letter-spacing:2px;margin-top:4px;}' +
    '#class-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:18px;max-width:780px;padding:0 24px;}' +
    '.class-card{width:160px;background:linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px 14px;cursor:pointer;transition:all 0.25s ease;text-align:center;position:relative;overflow:hidden;}' +
    '.class-card::before{content:"";position:absolute;top:0;left:0;right:0;bottom:0;border-radius:14px;opacity:0;transition:opacity 0.25s;background:linear-gradient(145deg,rgba(33,150,243,0.06),transparent);pointer-events:none;}' +
    '.class-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,0.15);background:linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02));}' +
    '.class-card:hover::before{opacity:1;}' +
    '.class-card.sel{border-color:rgba(33,150,243,0.4);box-shadow:0 0 24px rgba(33,150,243,0.08);}' +
    '.class-card.sel::before{opacity:1;}' +
    '.class-card .thumb{width:100%;height:80px;border-radius:8px;background:radial-gradient(ellipse at center,rgba(33,150,243,0.04),transparent);margin-bottom:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:6px;box-sizing:border-box;}' +
    '.class-card .thumb img{max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));}' +
    '.class-card .cname{color:#fff;font-size:14px;font-weight:bold;margin-bottom:6px;letter-spacing:0.5px;}' +
    '.class-card .cdesc{color:rgba(255,255,255,0.25);font-size:10px;margin-bottom:8px;line-height:1.3;}' +
    '.class-card .cstats{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;}' +
    '.class-card .cstats .cb{font-size:9px;padding:2px 7px;border-radius:3px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);letter-spacing:0.5px;}' +
    '.class-card .cstats .cb.high{color:#4caf50;background:rgba(76,175,80,0.08);}' +
    '.class-card .cstats .cb.low{color:#ef5350;background:rgba(239,83,80,0.08);}' +
    '.class-card .cstats .cb.mid{color:#ffa726;background:rgba(255,167,38,0.08);}' +
    '#class-footer{margin-top:28px;text-align:center;}' +
    '#class-confirm{padding:11px 48px;background:linear-gradient(135deg,rgba(33,150,243,0.2),rgba(33,150,243,0.1));border:1px solid rgba(33,150,243,0.25);border-radius:8px;color:#fff;font-size:14px;font-family:Arial,sans-serif;letter-spacing:2px;cursor:pointer;transition:all 0.25s;display:none;}' +
    '#class-confirm.show{display:inline-block;}' +
    '#class-confirm:hover{background:linear-gradient(135deg,rgba(33,150,243,0.3),rgba(33,150,243,0.15));border-color:rgba(33,150,243,0.4);transform:scale(1.03);}' +
    '#class-confirm:active{transform:scale(0.97);}',

  init() {
    this._classes = this._classes || {};

    var ov = document.createElement('div');
    ov.id = 'class-overlay';
    ov.innerHTML =
      '<div id="class-header">' +
        '<div class="ctitle">SINIF SEC</div>' +
        '<div class="csub">KARAKTERINI SEC VE HARITAYA GIR</div>' +
      '</div>' +
      '<div id="class-grid"></div>' +
      '<div id="class-footer"><div id="class-confirm">SEC</div></div>';
    document.body.appendChild(ov);
    this._el = ov;
    this._gridEl = ov.querySelector('#class-grid');
    this._confirmEl = ov.querySelector('#class-confirm');

    var self = this;
    this._confirmEl.addEventListener('click', function() { self._confirm(); });
    this._confirmEl.addEventListener('touchend', function(e) { e.preventDefault(); self._confirm(); });
  },

  register(id, cfg) {
    if (!this._classes) return;
    if (this._classes[id]) return;
    this._classes[id] = {
      id: id,
      name: cfg.name || id,
      modelId: cfg.modelId || 'model_player',
      description: cfg.description || '',
      hp: cfg.hp || 100,
      speed: cfg.speed || 1.0,
      gravity: cfg.gravity || 1.0,
      abilities: cfg.abilities || []
    };
    if (!this._selectedId) this._selectedId = id;
  },

  getSelected() {
    return this._selectedId ? this._classes[this._selectedId] : null;
  },

  get(id) {
    return this._classes[id] || null;
  },

  getAll() {
    var list = [];
    for (var id in this._classes) list.push(this._classes[id]);
    return list;
  },

  show(callback) {
    var self = this;
    this._resolve = callback;
    this._selectedCard = null;
    this._confirmEl.classList.remove('show');
    this._renderGrid();
    this._el.style.display = 'flex';
  },

  hide() {
    this._el.style.display = 'none';
    this._resolve = null;
  },

  _renderGrid() {
    var self = this;
    var ids = Object.keys(this._classes);
    if (ids.length === 0) { this._gridEl.innerHTML = '<div style="color:rgba(255,255,255,0.15);font-size:13px;padding:60px;">Kayitli sinif yok</div>'; return; }

    var html = '';
    for (var i = 0; i < ids.length; i++) {
      var c = this._classes[ids[i]];
      var sel = c.id === this._selectedId ? ' sel' : '';
      var hpClass = c.hp >= 150 ? 'high' : c.hp >= 100 ? 'mid' : 'low';
      var spClass = c.speed >= 1.2 ? 'high' : c.speed >= 0.9 ? 'mid' : 'low';
      var grClass = c.gravity <= 0.9 ? 'high' : c.gravity <= 1.1 ? 'mid' : 'low';
      html += '<div class="class-card' + sel + '" data-id="' + c.id + '">';
      html += '<div class="thumb" id="cthumb_' + c.id + '"><span style="color:rgba(255,255,255,0.08);font-size:10px;">3D</span></div>';
      html += '<div class="cname">' + c.name + '</div>';
      if (c.description) html += '<div class="cdesc">' + c.description + '</div>';
      html += '<div class="cstats">';
      html += '<span class="cb ' + hpClass + '">HP ' + c.hp + '</span>';
      html += '<span class="cb ' + spClass + '">HIZ %' + Math.round(c.speed * 100) + '</span>';
      html += '<span class="cb ' + grClass + '">YG ' + c.gravity.toFixed(1) + '</span>';
      html += '</div></div>';
    }
    this._gridEl.innerHTML = html;

    var cards = this._gridEl.querySelectorAll('.class-card');
    for (var ci = 0; ci < cards.length; ci++) {
      (function(card) {
        card.addEventListener('click', function() { self._select(card.dataset.id); });
        card.addEventListener('touchend', function(e) { e.preventDefault(); self._select(card.dataset.id); });
      })(cards[ci]);
    }

    setTimeout(function() {
      for (var ti = 0; ti < ids.length; ti++) {
        (function(cid) {
          var c = self._classes[cid];
          var thumbEl = document.getElementById('cthumb_' + cid);
          if (!thumbEl) return;
          var th = plugin.get('fx_thumbnail_helper');
          var url = th && th.getThumbnail ? th.getThumbnail(c.modelId, 120) : null;
          if (url) thumbEl.innerHTML = '<img src="' + url + '" alt="' + c.name + '">';
        })(ids[ti]);
      }
    }, 50);
  },

  _select(id) {
    var cards = this._gridEl.querySelectorAll('.class-card');
    for (var i = 0; i < cards.length; i++) cards[i].classList.remove('sel');
    var card = this._gridEl.querySelector('.class-card[data-id="' + id + '"]');
    if (card) card.classList.add('sel');
    this._selectedCard = id;
    this._confirmEl.classList.add('show');
  },

  _confirm() {
    if (!this._selectedCard) return;
    this._selectedId = this._selectedCard;
    var cb = this._resolve;
    this.hide();
    if (cb) cb(this._classes[this._selectedCard]);
  },

  _apply(c) {
    if (!c || !game || !game.player) return;
    if (game.player.maxHp !== undefined) game.player.maxHp = c.hp;
    if (game.player.hp !== undefined) game.player.hp = c.hp;
    if (game.move) game.move.setSpeed(c.speed * 5);
    if (game.player._gravityMultiplier !== undefined) game.player._gravityMultiplier = c.gravity;
    plugin.emit('class:selected', { classId: c.id, abilities: (c.abilities || []) });
  },

  destroy() {
    if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el);
    this._classes = {};
  }
});
