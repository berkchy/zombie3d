PluginRegistry.register({
  id: 'ui_hotbar',
  name: 'Hızlı Slot Çubuğu',
  type: 'ui',
  version: '1.0',
  description: '5 slotlu hızlı ekipman çubuğu',
  priority: 55,
  enabled: true,

  styles:
    '#hotbar{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:190;display:none;gap:8px;padding:8px 12px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:14px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}' +
    '#hotbar.show{display:flex;}' +
    '.hb-slot{width:48px;height:48px;border-radius:10px;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s ease;position:relative;overflow:hidden;}' +
    '.hb-slot:hover{background:rgba(255,255,255,0.08);}' +
    '.hb-slot.active{border-color:#4fc3f7;background:rgba(79,195,247,0.1);box-shadow:0 0 12px rgba(79,195,247,0.15);}' +
    '.hb-slot .hb-icon{width:100%;height:100%;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(255,255,255,0.15);}' +
    '.hb-slot .hb-key{position:absolute;top:2px;left:5px;font-size:8px;font-weight:600;color:rgba(255,255,255,0.2);letter-spacing:0;line-height:1;}' +
    '.hb-slot.active .hb-key{color:rgba(79,195,247,0.6);}',

  slots: null,
  slotEls: null,
  selectedIndex: -1,
  container: null,
  _onClick: null,
  _keyHandler: null,

  init(game) {
    var self = this;
    this.slots = [];
    this.slotEls = [];

    var container = document.createElement('div');
    container.id = 'hotbar';
    this.container = container;

    for (var i = 0; i < 5; i++) {
      this.slots.push({ id: null, icon: null });

      var slot = document.createElement('div');
      slot.className = 'hb-slot';
      slot.dataset.index = i;

      var key = document.createElement('div');
      key.className = 'hb-key';
      key.textContent = (i + 1);
      slot.appendChild(key);

      var icon = document.createElement('div');
      icon.className = 'hb-icon';
      icon.textContent = '\u25A0';
      slot.appendChild(icon);

      slot.addEventListener('click', (function(idx) {
        return function() { self.selectSlot(idx); };
      })(i));

      container.appendChild(slot);
      this.slotEls.push(slot);
    }

    document.body.appendChild(container);
    this.selectedIndex = -1;

    // API — diger pluginler game.hotbar ile yonetir
    game.hotbar = {
      setSlot: function(index, itemId) { return self.setSlot(index, itemId); },
      getSlot: function(index) { return self.getSlot(index); },
      selectSlot: function(index) { self.selectSlot(index); },
      getSelected: function() { return self.getSelected(); },
      clearSlot: function(index) { return self.clearSlot(index); },
      clearAll: function() { self.clearAll(); },
      setSlotIcon: function(index, dataUrl) { self.setSlotIcon(index, dataUrl); },
      length: 5
    };

    PluginRegistry.on('game:start', this.id, function() {
      container.classList.add('show');
    });

    PluginRegistry.on('game:over', this.id, function() {
      container.classList.remove('show');
    });

    // Klavye kisa yollari 1-5
    this._keyHandler = function(e) {
      var num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        self.selectSlot(num - 1);
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  },

  setSlot(index, itemId) {
    if (index < 0 || index >= 5) return null;
    this.slots[index].id = itemId || null;
    if (!itemId) this.slots[index].icon = null;
    this._renderSlot(index);
    return this.slots[index];
  },

  getSlot(index) {
    if (index < 0 || index >= 5) return null;
    return this.slots[index];
  },

  selectSlot(index) {
    if (index < 0 || index >= 5) return;
    if (this.selectedIndex === index) return;

    // Eski secimi kaldir
    if (this.selectedIndex >= 0 && this.slotEls[this.selectedIndex]) {
      this.slotEls[this.selectedIndex].classList.remove('active');
    }

    this.selectedIndex = index;

    // Yeni secimi isaretle
    var el = this.slotEls[index];
    if (el) el.classList.add('active');

    PluginRegistry.emit('hotbar:select', { index: index, slot: this.slots[index] });
  },

  getSelected() {
    if (this.selectedIndex < 0) return null;
    return { index: this.selectedIndex, slot: this.slots[this.selectedIndex] };
  },

  clearSlot(index) {
    if (index < 0 || index >= 5) return;
    this.slots[index] = { id: null, icon: null };
    this._renderSlot(index);
  },

  clearAll() {
    for (var i = 0; i < 5; i++) {
      this.slots[i] = { id: null, icon: null };
      this._renderSlot(i);
    }
  },

  setSlotIcon(index, dataUrl) {
    if (index < 0 || index >= 5) return;
    this.slots[index].icon = dataUrl || null;
    this._renderSlot(index);
  },

  _renderSlot(index) {
    var slot = this.slots[index];
    var el = this.slotEls[index];
    if (!el) return;

    var icon = el.querySelector('.hb-icon');
    if (!icon) return;

    if (slot.id && slot.icon) {
      icon.style.backgroundImage = 'url(' + slot.icon + ')';
      icon.style.backgroundSize = 'cover';
      icon.textContent = '';
    } else if (slot.id) {
      icon.style.backgroundImage = '';
      icon.textContent = '\u25A0';
    } else {
      icon.style.backgroundImage = '';
      icon.textContent = '\u25A0';
    }
  },

  destroy() {
    if (this.container) this.container.remove();
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    PluginRegistry.off('game:start', this.id);
    PluginRegistry.off('game:over', this.id);
    PluginRegistry.removeStyles(this.id);
    if (game) delete game.hotbar;
  }
});
