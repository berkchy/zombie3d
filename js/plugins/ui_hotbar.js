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
  _iconCache: null,
  _previewRenderer: null,
  _previewScene: null,
  _previewCam: null,

  init(game) {
    var self = this;
    this.slots = [];
    this.slotEls = [];
    this._iconCache = {};

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
    if (itemId) {
      this._renderWeaponIcon(index, itemId);
    } else {
      this.slots[index].icon = null;
      this._renderSlot(index);
    }
    return this.slots[index];
  },

  getSlot(index) {
    if (index < 0 || index >= 5) return null;
    return this.slots[index];
  },

  selectSlot(index) {
    if (index < 0 || index >= 5) return;
    if (this.selectedIndex === index) return;

    if (this.selectedIndex >= 0 && this.slotEls[this.selectedIndex]) {
      this.slotEls[this.selectedIndex].classList.remove('active');
    }

    this.selectedIndex = index;

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

  _renderWeaponIcon(index, weaponId) {
    // Cache kontrol
    if (this._iconCache && this._iconCache[weaponId]) {
      this.slots[index].icon = this._iconCache[weaponId];
      this._renderSlot(index);
      return;
    }

    var wp = PluginRegistry.get(weaponId);
    if (!wp || !wp.modelId) return;

    var modelP = PluginRegistry.get(wp.modelId);
    if (!modelP || !modelP.enabled || typeof modelP.createModel !== 'function') return;

    // Offscreen renderer (tembel baslatma)
    if (!this._previewRenderer) {
      var canvas = document.createElement('canvas');
      canvas.width = 72;
      canvas.height = 72;
      this._previewRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      this._previewRenderer.setSize(72, 72);
      this._previewRenderer.setPixelRatio(1);
      this._previewRenderer.setClearColor(0x000000, 0);

      this._previewScene = new THREE.Scene();
      this._previewScene.background = null;
      this._previewScene.add(new THREE.AmbientLight(0xffffff, 0.6));
      var dl = new THREE.DirectionalLight(0xffffff, 0.9);
      dl.position.set(3, 5, 4);
      this._previewScene.add(dl);
      var bl = new THREE.DirectionalLight(0x8888ff, 0.3);
      bl.position.set(-2, 3, -3);
      this._previewScene.add(bl);

      this._previewCam = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
    }

    // Modeli olustur
    var mesh;
    try { mesh = modelP.createModel(); } catch (e) { return; }
    if (!mesh) return;

    // Ortala ve olceklendir
    var box = new THREE.Box3().setFromObject(mesh);
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      var scale = 1.2 / maxDim;
      mesh.scale.set(scale, scale, scale);
    }
    var center = box.getCenter(new THREE.Vector3());
    mesh.position.sub(center);

    // Kamerayi modele gore konumlandir
    this._previewCam.position.set(1.5, 0.8, 1.5);
    this._previewCam.lookAt(0, 0, 0);

    this._previewScene.add(mesh);
    this._previewRenderer.render(this._previewScene, this._previewCam);
    this._previewScene.remove(mesh);

    // Dispose
    mesh.traverse(function(child) {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(function(mat) { mat.dispose(); });
          else child.material.dispose();
        }
      }
    });

    var dataUrl = this._previewRenderer.domElement.toDataURL();
    this._iconCache[weaponId] = dataUrl;
    this.slots[index].icon = dataUrl;
    this._renderSlot(index);
  },

  destroy() {
    if (this._previewRenderer) {
      this._previewRenderer.dispose();
      this._previewRenderer = null;
      this._previewScene = null;
      this._previewCam = null;
    }
    this._iconCache = null;
    if (this.container) this.container.remove();
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    PluginRegistry.off('game:start', this.id);
    PluginRegistry.off('game:over', this.id);
    PluginRegistry.removeStyles(this.id);
    if (game) delete game.hotbar;
  }
});
