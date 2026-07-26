var plugin = include('registry');

window.MENU_EXIT = 0;
window.MENU_NEXT = 1;
window.MENU_BACK = 2;
window.ITEM_NAME = 'name';
window.ITEM_ID = 'id';
window.ITEM_ENABLED = 'enabled';

plugin.register({
  id: 'system_text_menu',
  name: 'Metin Menü Sistemi',
  type: 'core',
  version: '4.0',
  description: 'Sol text menu, ortada numpad',
  enabled: true,
  priority: 85,

  _menus: null,
  _currentMenuId: null,
  _currentDraft: null,
  _menuStack: null,
  _selected: null,
  _page: 0,
  _el: null,
  _listEl: null,
  _numEl: null,
  _bindKey: null,

  styles:
    '#sys-menu-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:250;display:none;}' +
    '#sys-menu-list{position:fixed;top:50%;left:20px;transform:translateY(-50%);z-index:251;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.75);line-height:1.5;pointer-events:none;display:none;}' +
    '#sys-menu-list .mtitle{font-size:13px;font-weight:bold;color:#fff;margin-bottom:10px;letter-spacing:1px;}' +
    '#sys-menu-list .mitem{color:rgba(255,255,255,0.55);line-height:1.3;}' +
    '#sys-menu-list .mitem .num{color:rgba(255,255,255,0.2);margin-right:6px;}' +
    '#sys-menu-list .mitem.sel{color:#fff;}' +
    '#sys-menu-list .mitem.disabled{color:rgba(255,255,255,0.12);}' +
    '#sys-menu-list .msep{border-top:1px solid rgba(255,255,255,0.05);margin:4px 0;}' +
    '#sys-menu-list .mpage{color:rgba(255,255,255,0.18);font-size:10px;margin-top:2px;}' +
    '#sys-menu-list .mexit{color:rgba(255,255,255,0.2);font-size:10px;margin-top:4px;}' +
    '#sys-menu-list .mnav{color:rgba(255,255,255,0.2);font-size:10px;}' +
    '#sys-menu-numpad{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:251;display:none;grid-template-columns:repeat(3,1fr);gap:8px;padding:0;pointer-events:none;}' +
    '#sys-menu-numpad .np-btn{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-size:15px;font-family:Arial,sans-serif;cursor:pointer;pointer-events:auto;display:flex;align-items:center;justify-content:center;transition:background 0.1s;user-select:none;-webkit-user-select:none;}' +
    '#sys-menu-numpad .np-btn:active{background:rgba(255,255,255,0.12);}' +
    '#sys-menu-numpad .np-btn.dim{opacity:0.2;}' +
    '#sys-menu-numpad .np-btn.zero{grid-column:2;}',

  ITEMS_PER_PAGE: 7,

  init(game) {
    this._menus = {};
    this._menuStack = [];
    this._createUI();

    var self = this;
    this._bindKey = function(e) {
      if (!self._currentMenuId) return;
      var menu = self._menus[self._currentMenuId];
      if (!menu) return;
      var num = parseInt(e.key);
      if (num >= 1 && num <= self.ITEMS_PER_PAGE) {
        var idx = self._page * self.ITEMS_PER_PAGE + (num - 1);
        if (idx >= menu.items.length) return;
        self._select(menu, idx);
        self._confirm(menu);
        return;
      }
      if (num === 8 && menu.prop === window.MENU_BACK) {
        if (self._page > 0) { self._prevPage(menu); return; }
        var prev = self._menuStack.pop();
        if (prev) self._show(prev);
        else self._hide(menu.id);
        return;
      }
      if (num === 9 && menu.prop === window.MENU_NEXT) {
        if (self._page < self._totalPages(menu) - 1) self._nextPage(menu);
        return;
      }
      if (num === 0 && menu.prop === window.MENU_EXIT) {
        self._hide(menu.id);
        return;
      }
      if (e.key === 'Escape') {
        var prev = self._menuStack.pop();
        if (prev) self._show(prev);
        else self._hide(menu.id);
      }
    };
    document.addEventListener('keydown', this._bindKey);

    window.menu_create = this.menu_create.bind(this);
    window.menu_additem = this.menu_additem.bind(this);
    window.menu_setprop = this.menu_setprop.bind(this);
    window.menu_display = this.menu_display.bind(this);
    window.menu_get_data = this.menu_get_data.bind(this);
    window.menu_destroy = this.menu_destroy.bind(this);
  },

  _createUI() {
    var self = this;
    var ov = document.createElement('div');
    ov.id = 'sys-menu-overlay';
    ov.addEventListener('click', function(e) { if (e.target === ov) self._closeCurrent(); });
    ov.addEventListener('touchstart', function(e) { if (e.target === ov) self._closeCurrent(); });
    document.body.appendChild(ov);
    this._el = ov;

    var list = document.createElement('div');
    list.id = 'sys-menu-list';
    document.body.appendChild(list);
    this._listEl = list;

    var np = document.createElement('div');
    np.id = 'sys-menu-numpad';
    for (var i = 1; i <= 9; i++) {
      var btn = document.createElement('div');
      btn.className = 'np-btn';
      btn.textContent = '' + i;
      btn.dataset.idx = i - 1;
      if (i <= self.ITEMS_PER_PAGE) {
        btn.addEventListener('click', function(idx) {
          return function() {
            if (!self._currentMenuId) return;
            var m = self._menus[self._currentMenuId];
            if (!m) return;
            var realIdx = self._page * self.ITEMS_PER_PAGE + idx;
            if (realIdx >= m.items.length) return;
            self._select(m, realIdx);
            self._confirm(m);
          };
        }(i - 1));
        btn.addEventListener('touchend', function(idx) {
          return function(e) {
            e.preventDefault();
            if (!self._currentMenuId) return;
            var m = self._menus[self._currentMenuId];
            if (!m) return;
            var realIdx = self._page * self.ITEMS_PER_PAGE + idx;
            if (realIdx >= m.items.length) return;
            self._select(m, realIdx);
            self._confirm(m);
          };
        }(i - 1));
      } else if (i === 8) {
        btn.addEventListener('click', function() {
          if (!self._currentMenuId) return;
          var m = self._menus[self._currentMenuId];
          if (!m || m.prop !== window.MENU_BACK) return;
          if (self._page > 0) { self._prevPage(m); return; }
          var prv = self._menuStack.pop();
          if (prv) self._show(prv);
          else self._hide(m.id);
        });
        btn.addEventListener('touchend', function(e) {
          e.preventDefault();
          if (!self._currentMenuId) return;
          var m = self._menus[self._currentMenuId];
          if (!m || m.prop !== window.MENU_BACK) return;
          if (self._page > 0) { self._prevPage(m); return; }
          var prv = self._menuStack.pop();
          if (prv) self._show(prv);
          else self._hide(m.id);
        });
      } else {
        btn.addEventListener('click', function() { if (self._currentMenuId) { var m = self._menus[self._currentMenuId]; if (m && m.prop === window.MENU_NEXT && self._page < self._totalPages(m) - 1) self._nextPage(m); } });
        btn.addEventListener('touchend', function(e) { e.preventDefault(); if (self._currentMenuId) { var m = self._menus[self._currentMenuId]; if (m && m.prop === window.MENU_NEXT && self._page < self._totalPages(m) - 1) self._nextPage(m); } });
      }
      np.appendChild(btn);
    }
    var zero = document.createElement('div');
    zero.className = 'np-btn zero';
    zero.textContent = '0';
    zero.addEventListener('click', function() {
      if (!self._currentMenuId) return;
      var m = self._menus[self._currentMenuId];
      if (m && m.prop === window.MENU_EXIT) self._hide(m.id);
    });
    zero.addEventListener('touchend', function(e) {
      e.preventDefault();
      if (!self._currentMenuId) return;
      var m = self._menus[self._currentMenuId];
      if (m && m.prop === window.MENU_EXIT) self._hide(m.id);
    });
    np.appendChild(zero);

    document.body.appendChild(np);
    this._numEl = np;
  },

  _pageItems(menu) {
    var start = this._page * this.ITEMS_PER_PAGE;
    return menu.items.slice(start, start + this.ITEMS_PER_PAGE);
  },

  _totalPages(menu) {
    return Math.ceil(menu.items.length / this.ITEMS_PER_PAGE);
  },

  _prevPage(menu) {
    if (this._page <= 0) return;
    this._page--;
    menu._selectedIdx = -1;
    this._selected = null;
    this._render(menu);
  },

  _nextPage(menu) {
    if (this._page >= this._totalPages(menu) - 1) return;
    this._page++;
    menu._selectedIdx = -1;
    this._selected = null;
    this._render(menu);
  },

  _select(menu, idx) {
    if (!menu || !menu.items || idx < 0 || idx >= menu.items.length) return;
    var item = menu.items[idx];
    if (!item.enabled) return;
    if (menu._selectedIdx === idx) return;
    menu._selectedIdx = idx;
    this._selected = item;
    this._render(menu);
  },

  _confirm(menu) {
    if (menu._selectedIdx < 0 || !menu.items[menu._selectedIdx]) return;
    var item = menu.items[menu._selectedIdx];
    if (!item.enabled) return;
    this._selected = item;

    var data = {
      ITEM_NAME: item.text,
      ITEM_ID: menu._selectedIdx + 1,
      ITEM_ENABLED: 1
    };

    try { if (menu.callback) menu.callback(data); } catch(e) { console.error('[text_menu] callback error:', e); }
    plugin.emit('menu_' + menu.id, data);

    switch (menu.prop) {
      case window.MENU_EXIT:
        this._hide(menu.id);
        break;
      case window.MENU_NEXT:
        break;
      case window.MENU_BACK:
        var prev = this._menuStack.pop();
        if (prev) this._show(prev);
        else this._hide(menu.id);
        break;
    }
  },

  _render(menu) {
    if (!menu) return;
    var html = '<div class="mtitle">' + menu.title + '</div>';
    var pageItems = this._pageItems(menu);
    for (var i = 0; i < pageItems.length; i++) {
      var item = pageItems[i];
      var sel = menu._selectedIdx === (this._page * this.ITEMS_PER_PAGE + i);
      html += '<div class="mitem' + (sel ? ' sel' : '') + (!item.enabled ? ' disabled' : '') + '"><span class="num">' + (i + 1) + '.</span>' + item.text + '</div>';
    }
    var total = this._totalPages(menu);
    if (total > 1) {
      html += '<div class="msep"></div>';
      html += '<div class="mpage">' + (this._page + 1) + '/' + total + '</div>';
    }
    if (menu.prop === window.MENU_BACK) {
      html += '<div class="mnav">8: Geri</div>';
    }
    if (menu.prop === window.MENU_NEXT) {
      html += '<div class="mnav">9: Ileri</div>';
    }
    if (menu.prop === window.MENU_EXIT) {
      html += '<div class="mexit">0: Cikis</div>';
    }
    this._listEl.innerHTML = html;

    var btns = this._numEl.querySelectorAll('.np-btn');
    var plen = pageItems.length;
    for (var j = 0; j < btns.length; j++) {
      var b = btns[j];
      if (j < 7) {
        if (j >= plen) { b.classList.add('dim'); b.style.pointerEvents = 'none'; }
        else { b.classList.remove('dim'); b.style.pointerEvents = 'auto'; }
      }
    }
  },

  _show(menuId) {
    var menu = this._menus[menuId];
    if (!menu) return;
    this._currentMenuId = menuId;
    this._page = 0;
    menu._selectedIdx = -1;
    this._selected = null;
    this._render(menu);
    this._el.style.display = 'block';
    this._listEl.style.display = 'block';
    this._numEl.style.display = 'grid';
  },

  _hide(menuId) {
    this._currentMenuId = null;
    this._selected = null;
    this._el.style.display = 'none';
    this._listEl.style.display = 'none';
    this._numEl.style.display = 'none';
  },

  _closeCurrent() {
    if (!this._currentMenuId) return;
    if (this._menuStack.length > 0) {
      var prev = this._menuStack.pop();
      this._show(prev);
    } else {
      this._hide(this._currentMenuId);
    }
  },

  menu_create(title, callback) {
    var id = 'menu_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    this._menus[id] = {
      id: id,
      title: title || 'MENU',
      items: [],
      callback: typeof callback === 'function' ? callback : null,
      prop: window.MENU_EXIT,
      _selectedIdx: -1
    };
    this._currentDraft = id;
    return id;
  },

  menu_additem(text, enabled) {
    if (!this._currentDraft || !this._menus[this._currentDraft]) return;
    this._menus[this._currentDraft].items.push({
      text: text || '',
      enabled: enabled !== 0
    });
  },

  menu_setprop(prop) {
    if (!this._currentDraft || !this._menus[this._currentDraft]) return;
    this._menus[this._currentDraft].prop = prop;
  },

  menu_display(menuId) {
    if (!menuId || !this._menus[menuId]) return;
    if (this._currentMenuId && this._currentMenuId !== menuId) {
      this._menuStack.push(this._currentMenuId);
    }
    this._show(menuId);
  },

  menu_get_data(key) {
    if (!this._selected) return null;
    if (!this._currentMenuId || !this._menus[this._currentMenuId]) return null;
    var menu = this._menus[this._currentMenuId];
    switch (key) {
      case window.ITEM_NAME: return this._selected.text;
      case window.ITEM_ID: return (menu._selectedIdx >= 0 ? menu._selectedIdx : -1) + 1;
      case window.ITEM_ENABLED: return 1;
      default: return null;
    }
  },

  menu_destroy(menuId) {
    if (!menuId || !this._menus[menuId]) return;
    if (this._currentMenuId === menuId) this._hide(menuId);
    var idx = this._menuStack.indexOf(menuId);
    if (idx >= 0) this._menuStack.splice(idx, 1);
    if (this._currentDraft === menuId) this._currentDraft = null;
    delete this._menus[menuId];
  },

  update() {},

  destroy() {
    document.removeEventListener('keydown', this._bindKey);
    this._menus = null;
    this._menuStack = null;
    this._currentMenuId = null;
    this._currentDraft = null;
    this._selected = null;
    ['sys-menu-overlay','sys-menu-list','sys-menu-numpad'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }
});
