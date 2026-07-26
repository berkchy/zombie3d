var plugin = include('registry');

plugin.register({
  id: 'ui_model_test',
  name: 'Model Test Odası',
  type: 'ui',
  version: '1.0',
  description: '3D modelleri önizleme ve test ortamı',
  priority: 60,
  enabled: true,

  styles:
    '#modelTestOverlay{position:fixed;inset:0;z-index:200;display:none;pointer-events:none;}' +
    '#modelTestOverlay.open{display:block;}' +
    '#modelTestOverlay.open{display:block;}' +
    'body.model-test-active #levelContainer,body.model-test-active #joystick-area,body.model-test-active .pause-overlay,body.model-test-active #gameOver,body.model-test-active .menu-overlay{display:none!important;}' +
    'body.model-test-panel-open #gameContainer{transform:translateX(-150px);transition:transform .3s cubic-bezier(.4,0,.2,1);}' +
    '#gameContainer{transition:transform .3s cubic-bezier(.4,0,.2,1);}' +
    '#modelTestToggle{position:fixed;top:10px;right:54px;z-index:220;width:38px;height:38px;background:rgba(0,0,0,0.55);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:10px;display:none;align-items:center;justify-content:center;font-size:16px;cursor:pointer;pointer-events:auto;user-select:none;transition:all .2s cubic-bezier(.4,0,.2,1);}' +
    '#modelTestToggle:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.15);color:#fff;}' +
    '#modelTestToggle.show{display:flex;}' +
    '#modelTestPanel{position:fixed;top:0;right:-280px;width:260px;height:100%;z-index:210;background:rgba(10,10,16,0.96);border-left:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(12px);display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,0.4);transition:right .3s cubic-bezier(.4,0,.2,1);pointer-events:auto;}' +
    '#modelTestPanel.open{right:0;}' +
    '#modelTestPanel .mt-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,0.05);}' +
    '#modelTestPanel .mt-header h2{font-size:11px;font-weight:600;color:rgba(255,255,255,0.9);letter-spacing:2px;text-transform:uppercase;}' +
    '#modelTestPanel .mt-header .mt-close{font-size:16px;cursor:pointer;opacity:0.3;transition:opacity .2s;padding:2px;line-height:1;}' +
    '#modelTestPanel .mt-header .mt-close:hover{opacity:0.8;}' +
    '#modelTestList{flex:1;overflow-y:auto;padding:8px 12px 12px;}' +
    '#modelTestList::-webkit-scrollbar{width:4px;}' +
    '#modelTestList::-webkit-scrollbar-track{background:transparent;}' +
    '#modelTestList::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}' +
    '.mt-card{display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:3px;border-radius:8px;cursor:pointer;transition:all .15s ease;border:1px solid transparent;}' +
    '.mt-card:hover{background:rgba(255,255,255,0.04);}' +
    '.mt-card.active{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1);}' +
    '.mt-card .mt-icon{width:36px;height:36px;border-radius:6px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;overflow:hidden;}' +
    '.mt-card .mt-info{flex:1;min-width:0;}' +
    '.mt-card .mt-name{font-size:12px;color:rgba(255,255,255,0.85);font-weight:500;}' +
    '.mt-card .mt-desc{font-size:10px;color:rgba(255,255,255,0.25);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.mt-card .mt-check{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.1);flex-shrink:0;transition:all .2s;display:flex;align-items:center;justify-content:center;}' +
    '.mt-card.active .mt-check{border-color:#4caf50;background:#4caf50;}' +
    '.mt-card.active .mt-check::after{content:"";width:6px;height:6px;border-radius:50%;background:#fff;}' +
    '#mtBackBtn{display:block;margin:10px 12px;padding:9px 0;width:calc(100% - 24px);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;border:none;border-radius:6px;background:transparent;color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:all .2s;}' +
    '#mtBackBtn:hover{color:rgba(255,255,255,0.8);border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.04);}' +
    '.mt-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;padding:10px 0 6px;border-bottom:1px solid rgba(255,255,255,0.04);margin-bottom:4px;}' +
    '#mtRotateRow{display:none;padding:6px 12px 12px;align-items:center;gap:10px;}' +
    '#mtRotateRow.show{display:flex;}' +
    '#mtRotateRow .mt-rot-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.2);letter-spacing:1.5px;text-transform:uppercase;white-space:nowrap;}' +
    '#mtRotateRow .mt-rot-slider{-webkit-appearance:none;appearance:none;flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.08);outline:none;}' +
    '#mtRotateRow .mt-rot-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:#4fc3f7;border:2px solid #0a0a0a;cursor:pointer;}' +
    '#mtRotateRow .mt-rot-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#4fc3f7;border:2px solid #0a0a0a;cursor:pointer;}' +
    '#mtRotateRow .mt-rot-val{font-size:11px;font-weight:500;color:rgba(255,255,255,0.5);min-width:36px;text-align:right;font-family:monospace;}',

  visible: false,
  panelOpen: false,
  roomGroup: null,
  currentModel: null,
  currentModelId: null,
  overlay: null,
  listEl: null,
  toggleBtn: null,
  _previews: null,
  _childMode: false,
  _childList: null,
  _highlightedChild: null,
  _savedMat: null,
  _labelEl: null,
  _subModels: null,
  _subModelActive: null,
  _subModelMode: false,

  _savedBg: null,
  _savedFog: null,
  _savedCamPos: null,
  _rotSpeed: 0.4,
  _userRotY: 0,
  _userRotX: 0,
  _isDragging: false,
  _dragLastX: 0,
  _dragLastY: 0,
  _dragMode: false,

  init(game) {
    this.game = game;

    // Toggle button
    var toggleBtn = document.createElement('div');
    toggleBtn.id = 'modelTestToggle';
    toggleBtn.title = 'Model Listesi';
    toggleBtn.textContent = '\u25C8';
    document.body.appendChild(toggleBtn);
    this.toggleBtn = toggleBtn;

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'modelTestOverlay';
    overlay.innerHTML =
      '<div id="modelTestPanel">' +
        '<div class="mt-header">' +
          '<h2 id="mtPanelTitle">Modeller</h2>' +
          '<span class="mt-close" id="mtClose">Gizle</span>' +
        '</div>' +
        '<div id="mtSubLabel" class="mt-label" style="padding-left:12px;padding-top:12px;display:none;">Yüklü Modeller</div>' +
        '<div id="modelTestList"></div>' +
        '<div id="modelTestExtra"></div>' +
        '<div id="mtRotateRow">' +
          '<span class="mt-rot-label">Dönüş</span>' +
          '<input type="range" class="mt-rot-slider" id="mtRotSlider" min="0" max="2.0" step="0.05" value="0.4">' +
          '<span class="mt-rot-val" id="mtRotVal">0.40</span>' +
        '</div>' +
        '<button id="mtBackBtn">ANA MENÜ</button>' +
      '</div>';
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.listEl = document.getElementById('modelTestList');
    this._labelEl = document.getElementById('mtSubLabel');

    var self = this;
    document.getElementById('mtClose').addEventListener('click', function() { self.hidePanel(); });
    document.getElementById('mtBackBtn').addEventListener('click', function() {
      if (self._childMode) { self._exitChildMode(); return; }
      if (self._subModelMode) { self._exitSubModelMode(); return; }
      if (self._subModelActive) {
        self._subModelActive = null;
        self._enterSubModelMode();
        return;
      }
      self.close();
    });

    // Toggle button
    this.toggleBtn.addEventListener('click', function() {
      if (self.panelOpen) self.hidePanel(); else self.showPanel();
    });

    // Rotation slider
    var rotSlider = document.getElementById('mtRotSlider');
    if (rotSlider) {
      rotSlider.addEventListener('input', function() {
        self._rotSpeed = parseFloat(this.value);
        var valEl = document.getElementById('mtRotVal');
        if (valEl) valEl.textContent = self._rotSpeed.toFixed(2);
      });
    }

    // Drag-to-rotate
    this._onMouseDown = function(e) {
      if (!self.visible || !self.currentModel) return;
      self._dragMode = true;
      self._isDragging = true;
      self._dragLastX = e.clientX;
      self._dragLastY = e.clientY;
      self._userRotY = self.currentModel.rotation.y;
      self._userRotX = self.currentModel.rotation.x;
    };
    this._onMouseMove = function(e) {
      if (!self._isDragging || !self.currentModel) return;
      var dx = e.clientX - self._dragLastX;
      var dy = e.clientY - self._dragLastY;
      self._dragLastX = e.clientX;
      self._dragLastY = e.clientY;
      self._userRotY += dx * 0.01;
      self._userRotX += dy * 0.008;
      self._userRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 4, self._userRotX));
    };
    this._onMouseUp = function() { self._isDragging = false; };
    this._onTouchStart = function(e) {
      if (!self.visible || !self.currentModel) return;
      self._dragMode = true;
      self._isDragging = true;
      var t = e.changedTouches[0];
      self._dragLastX = t.clientX;
      self._dragLastY = t.clientY;
      self._userRotY = self.currentModel.rotation.y;
      self._userRotX = self.currentModel.rotation.x;
    };
    this._onTouchMove = function(e) {
      if (!self._isDragging || !self.currentModel) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - self._dragLastX;
      var dy = t.clientY - self._dragLastY;
      self._dragLastX = t.clientX;
      self._dragLastY = t.clientY;
      self._userRotY += dx * 0.01;
      self._userRotX += dy * 0.008;
      self._userRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 4, self._userRotX));
    };
    this._onTouchEnd = function() { self._isDragging = false; };

    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('touchstart', this._onTouchStart, { passive: true });
    document.addEventListener('touchmove', this._onTouchMove, { passive: true });
    document.addEventListener('touchend', this._onTouchEnd);

    plugin.on('menu:model_test', this.id, function() { self.open(); });
  },

  open() {
    if (this.visible) return;
    this.visible = true;

    // Game UI'larını gizle (CSS ile)
    document.body.classList.add('model-test-active');
    if (this.game) this.game.testRoomActive = true;
    var hud = document.getElementById('hud');
    if (hud) { this._hudShow = hud.classList.contains('show'); hud.classList.remove('show'); }

    // Scene state
    this._savedBg = scene.background;
    this._savedFog = scene.fog;
    scene.background = new THREE.Color(0x1a1a28);
    scene.fog = null;

    // Mevcut sahne objelerini gizle (arena, oyuncu vb.)
    this._savedChildren = [];
    while (scene.children.length > 0) {
      this._savedChildren.push(scene.children[0]);
      scene.remove(scene.children[0]);
    }

    // Room
    this.roomGroup = new THREE.Group();

    var pGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.06, 48);
    var pMat = new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.5, metalness: 0.3 });
    var plat = new THREE.Mesh(pGeo, pMat);
    plat.position.y = -0.03;
    plat.receiveShadow = true;
    this.roomGroup.add(plat);

    var rGeo = new THREE.RingGeometry(2.0, 2.2, 48);
    var rMat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, side: THREE.DoubleSide, transparent: true, opacity: 0.12 });
    var ring = new THREE.Mesh(rGeo, rMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    this.roomGroup.add(ring);

    var r2Geo = new THREE.RingGeometry(0.5, 0.7, 32);
    var r2Mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.04 });
    var ring2 = new THREE.Mesh(r2Geo, r2Mat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.006;
    this.roomGroup.add(ring2);

    this.roomGroup.add(new THREE.AmbientLight(0x8888bb, 0.6));
    var dl = new THREE.DirectionalLight(0xffffff, 1.2);
    dl.position.set(5, 12, 5);
    dl.castShadow = true;
    this.roomGroup.add(dl);
    var fl = new THREE.DirectionalLight(0x8888ff, 0.5);
    fl.position.set(-4, 6, -4);
    this.roomGroup.add(fl);
    var rl = new THREE.DirectionalLight(0xff8844, 0.3);
    rl.position.set(-2, -1, -5);
    this.roomGroup.add(rl);
    var bl = new THREE.PointLight(0x4fc3f7, 0.3, 10);
    bl.position.set(0, 0.5, 0);
    this.roomGroup.add(bl);

    scene.add(this.roomGroup);

    // Camera
    this._savedCamPos = camera.position.clone();
    camera.position.set(0, 3, 4);
    camera.lookAt(0, 0.7, 0);

    // Menu gizle
    var menuOv = document.querySelector('.menu-overlay');
    if (menuOv) { this._menuHidden = menuOv.classList.contains('hidden'); menuOv.classList.add('hidden'); }

    // Overlay'i göster + panel otomatik aç + toggle her zaman görünür
    this.overlay.classList.add('open');
    this.panelOpen = true;
    var panel = document.getElementById('modelTestPanel');
    if (panel) panel.classList.add('open');
    this.toggleBtn.classList.add('show');

    this._updateShift();

    this.buildList();

    plugin.emit('model_test:open');
  },

  showPanel() {
    if (this.panelOpen) return;
    this.panelOpen = true;
    var panel = document.getElementById('modelTestPanel');
    if (panel) panel.classList.add('open');
    this._updateShift();
  },

  hidePanel() {
    if (!this.panelOpen) return;
    this.panelOpen = false;
    var panel = document.getElementById('modelTestPanel');
    if (panel) panel.classList.remove('open');
    this._updateShift();
  },

  _updateShift() {
    document.body.classList.toggle('model-test-panel-open', this.visible && this.panelOpen);
  },

  buildList() {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';
    var models = plugin.getByType('model');
    var self = this;

    models.forEach(function(m) {
      var card = document.createElement('div');
      card.className = 'mt-card' + (m.id === self.currentModelId ? ' active' : '');
      card.dataset.modelId = m.id;

      var icon = document.createElement('div');
      icon.className = 'mt-icon';
      icon.dataset.modelId = m.id;

      var info = document.createElement('div');
      info.className = 'mt-info';
      info.innerHTML = '<div class="mt-name">' + m.name + '</div>' +
        '<div class="mt-desc">' + (m.description || '') + '</div>';

      var check = document.createElement('div');
      check.className = 'mt-check';

      card.appendChild(icon);
      card.appendChild(info);
      card.appendChild(check);

      card.addEventListener('click', function() {
        self.selectModel(m.id);
      });

      self.listEl.appendChild(card);
    });

    // Model preview'lerini render et
    this._renderPreviews();
  },

  _renderPreviews() {
    var models = plugin.getByType('model');
    if (models.length === 0) return;

    var canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(72, 72);
    renderer.setPixelRatio(1);

    var pScene = new THREE.Scene();
    pScene.background = new THREE.Color(0x181820);
    var amb = new THREE.AmbientLight(0xffffff, 0.6);
    pScene.add(amb);
    var dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(3, 5, 4);
    pScene.add(dl);
    var bl = new THREE.DirectionalLight(0x8888ff, 0.3);
    bl.position.set(-2, 3, -3);
    pScene.add(bl);

    var pCam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    pCam.position.set(1.5, 1.2, 2.5);
    pCam.lookAt(0, 0, 0);

    for (var i = 0; i < models.length; i++) {
      var m = models[i];
      if (!m.enabled || typeof m.createModel !== 'function') continue;
      var icon = this.listEl.querySelector('.mt-icon[data-model-id="' + m.id + '"]');
      if (!icon) continue;

      var mesh;
      try { mesh = m.createModel(); } catch (e) { continue; }
      if (!mesh) continue;

      // Modeli ortala
      var box = new THREE.Box3().setFromObject(mesh);
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        var scale = 1.2 / maxDim;
        mesh.scale.set(scale, scale, scale);
      }
      var center = box.getCenter(new THREE.Vector3());
      mesh.position.sub(center);

      pScene.add(mesh);
      renderer.render(pScene, pCam);
      pScene.remove(mesh);

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

      icon.style.backgroundImage = 'url(' + canvas.toDataURL() + ')';
      icon.style.backgroundSize = 'cover';
      icon.style.backgroundPosition = 'center';
      icon.textContent = '';
    }

    renderer.dispose();
  },

  selectModel(id) {
    if (this.currentModelId === id && this.currentModel) return;
    this.currentModelId = id;

    if (this._modelWrapper) {
      this.roomGroup.remove(this._modelWrapper);
      this._modelWrapper = null;
    }
    this.currentModel = null;
    this._clearHighlight();
    this._userRotY = 0;
    this._userRotX = 0;
    this._dragMode = false;

    var modelDef = plugin.get(id);
    if (!modelDef || !modelDef.enabled) return;

    // Alt-modelleri varsa onlari listele
    if (modelDef.subModels && modelDef.subModels.length > 0) {
      this._childMode = false;
      this._subModels = modelDef.subModels;
      this._subModelActive = null;
      this._enterSubModelMode();
      return;
    }
    this._subModels = null;
    this._subModelActive = null;

    if (typeof modelDef.createModel !== 'function') return;

    this._displayModel(modelDef.createModel(), id);
  },

  _displayModel(mesh, id) {
    var wrapper = new THREE.Group();

    // Boyutu normalize et
    var box = new THREE.Box3().setFromObject(mesh);
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      var targetSize = 1.8;
      var scale = targetSize / maxDim;
      mesh.scale.set(scale, scale, scale);
    }
    // Scale sonrasi yeniden box alip ortala
    var box2 = new THREE.Box3().setFromObject(mesh);
    var center = box2.getCenter(new THREE.Vector3());
    mesh.position.sub(center);

    wrapper.add(mesh);
    wrapper.position.y = 0.4;
    this.roomGroup.add(wrapper);
    this._modelWrapper = wrapper;
    this.currentModel = mesh;

    if (id) {
      var cards = this.listEl.querySelectorAll('.mt-card');
      for (var i = 0; i < cards.length; i++) {
        cards[i].classList.toggle('active', cards[i].dataset.modelId === id);
      }
    }

    // Rotation slider goster
    var rotRow = document.getElementById('mtRotateRow');
    if (rotRow) rotRow.classList.add('show');

    // Cocuk mesh'leri tara
    this._childList = [];
    this._collectChildren(mesh, 0, this._childList);
    this._highlightedChild = null;
    this._savedMat = null;

    if (this._childList.length > 0) {
      this._enterChildMode();
    } else {
      if (this._labelEl) this._labelEl.style.display = 'none';
      var btn = document.getElementById('mtBackBtn');
      btn.textContent = this._subModelActive ? '← GERİ' : 'ANA MENÜ';
    }

    var modelDef = plugin.get(this.currentModelId);
    plugin.emit('model_test:select', { modelId: this.currentModelId, modelDef: modelDef, mesh: mesh });
  },

  _collectChildren(group, depth, results) {
    if (!group) return;
    for (var i = 0; i < group.children.length; i++) {
      var c = group.children[i];
      var name = c.name || 'Unnamed ' + (c.type || 'object');
      if (c.isMesh || c.isGroup) {
        results.push({ mesh: c, name: name, depth: depth, type: c.type });
      }
      if (c.children && c.children.length > 0) {
        this._collectChildren(c, depth + 1, results);
      }
    }
  },

  _enterChildMode() {
    this._childMode = true;
    var title = document.getElementById('mtPanelTitle');
    if (title) title.textContent = this.currentModelId.toUpperCase();
    this._labelEl.style.display = 'block';
    this._labelEl.textContent = 'Alt Parçalar';
    var btn = document.getElementById('mtBackBtn');
    if (btn) btn.textContent = '← GERİ';
    this.buildChildList();
  },

  _exitChildMode() {
    this._childMode = false;
    this._clearHighlight();
    // Sub-model'den geldiysek sub-model listesine don
    if (this._subModels && this._subModelActive) {
      this._subModelActive = null;
      this._enterSubModelMode();
      return;
    }
    var title = document.getElementById('mtPanelTitle');
    if (title) title.textContent = 'Modeller';
    this._labelEl.style.display = 'none';
    var btn = document.getElementById('mtBackBtn');
    if (btn) btn.textContent = 'ANA MENÜ';
    this.buildList();
  },

  _enterSubModelMode() {
    this._subModelMode = true;
    var title = document.getElementById('mtPanelTitle');
    if (title) title.textContent = this.currentModelId.toUpperCase();
    this._labelEl.style.display = 'block';
    this._labelEl.textContent = 'Alt Modeller';
    var btn = document.getElementById('mtBackBtn');
    if (btn) btn.textContent = '← GERİ';
    this.buildSubModelList();
  },

  _exitSubModelMode() {
    this._subModelMode = false;
    this._subModels = null;
    this._subModelActive = null;
    var title = document.getElementById('mtPanelTitle');
    if (title) title.textContent = 'Modeller';
    this._labelEl.style.display = 'none';
    var btn = document.getElementById('mtBackBtn');
    if (btn) btn.textContent = 'ANA MENÜ';
    this.buildList();
  },

  buildSubModelList() {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';
    var self = this;

    if (!this._subModels || this._subModels.length === 0) {
      this.listEl.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.2);font-size:12px;">Alt model bulunamadı</div>';
      return;
    }

    this._subModels.forEach(function(item, idx) {
      var card = document.createElement('div');
      card.className = 'mt-card' + (item.id === self._subModelActive ? ' active' : '');
      card.dataset.subIdx = idx;

      var icon = document.createElement('div');
      icon.className = 'mt-icon';
      icon.textContent = '◈';

      var info = document.createElement('div');
      info.className = 'mt-info';
      info.innerHTML = '<div class="mt-name">' + item.name + '</div>' +
        '<div class="mt-desc">' + (item.desc || '') + '</div>';

      var check = document.createElement('div');
      check.className = 'mt-check';

      card.appendChild(icon);
      card.appendChild(info);
      card.appendChild(check);

      card.addEventListener('click', function() {
        self._selectSubModel(idx);
      });

      self.listEl.appendChild(card);
    });
  },

  _selectSubModel(idx) {
    if (!this._subModels || idx < 0 || idx >= this._subModels.length) return;
    var item = this._subModels[idx];
    this._subModelActive = item.id;
    this._subModelMode = false;

    // Onceki modeli kaldir
    if (this._modelWrapper) {
      this.roomGroup.remove(this._modelWrapper);
      this._modelWrapper = null;
    }
    this.currentModel = null;
    this._clearHighlight();
    this._childMode = false;
    this._childList = [];

    var modelDef = plugin.get(this.currentModelId);
    if (!modelDef) return;

    var mesh;
    if (typeof modelDef.createSubModel === 'function') {
      mesh = modelDef.createSubModel(item.id);
    } else if (typeof modelDef.createModel === 'function') {
      mesh = modelDef.createModel();
    } else {
      this._subModelActive = null;
      return;
    }
    if (!mesh) {
      this._subModelActive = null;
      return;
    }

    this._displayModel(mesh);
  },

  _clearHighlight() {
    if (this._highlightedChild && this._savedMat) {
      var old = this._savedMat;
      var h = this._highlightedChild;
      if (h.isMesh && h.material) {
        if (Array.isArray(h.material)) {
          for (var i = 0; i < h.material.length && i < old.length; i++) {
            h.material[i].emissive.setHex(old[i].emissive);
            h.material[i].emissiveIntensity = old[i].intensity;
          }
        } else {
          h.material.emissive.setHex(old.emissive);
          h.material.emissiveIntensity = old.intensity;
        }
      }
    }
    this._highlightedChild = null;
    this._savedMat = null;
  },

  _highlightMesh(mesh) {
    this._clearHighlight();
    if (!mesh || !mesh.isMesh) return;
    this._highlightedChild = mesh;
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        this._savedMat = [];
        for (var i = 0; i < mesh.material.length; i++) {
          this._savedMat.push({ emissive: mesh.material[i].emissive.getHex(), intensity: mesh.material[i].emissiveIntensity });
          mesh.material[i].emissive.setHex(0x4fc3f7);
          mesh.material[i].emissiveIntensity = 0.5;
        }
      } else {
        this._savedMat = { emissive: mesh.material.emissive.getHex(), intensity: mesh.material.emissiveIntensity };
        mesh.material.emissive.setHex(0x4fc3f7);
        mesh.material.emissiveIntensity = 0.5;
      }
    }
  },

  buildChildList() {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';
    var self = this;

    if (!this._childList || this._childList.length === 0) {
      this.listEl.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.2);font-size:12px;">Alt parça bulunamadı</div>';
      return;
    }

    this._childList.forEach(function(item, idx) {
      var card = document.createElement('div');
      card.className = 'mt-card' + (item.mesh === self._highlightedChild ? ' active' : '');
      card.dataset.childIdx = idx;

      var icon = document.createElement('div');
      icon.className = 'mt-icon';
      icon.textContent = item.type === 'Group' ? '📁' : '◆';

      var info = document.createElement('div');
      info.className = 'mt-info';
      info.innerHTML = '<div class="mt-name">' + item.name + '</div>' +
        '<div class="mt-desc">' + item.type + (item.depth > 0 ? ' · seviye ' + item.depth : '') + '</div>';

      var check = document.createElement('div');
      check.className = 'mt-check';

      card.appendChild(icon);
      card.appendChild(info);
      card.appendChild(check);

      card.addEventListener('click', function() {
        self._selectChild(idx);
      });

      self.listEl.appendChild(card);
    });
  },

  _selectChild(idx) {
    if (!this._childList || idx < 0 || idx >= this._childList.length) return;
    var item = this._childList[idx];
    this._highlightMesh(item.mesh);

    var cards = this.listEl.querySelectorAll('.mt-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('active', parseInt(cards[i].dataset.childIdx) === idx);
    }
  },

  update(dt) {
    if (!this.visible) return;
    if (this.currentModel) {
      if (this._isDragging) {
          this.currentModel.rotation.y = this._userRotY;
          this.currentModel.rotation.x = this._userRotX;
      } else {
        this.currentModel.rotation.y += dt * this._rotSpeed;
        this._userRotY = this.currentModel.rotation.y;
      }
    }
    camera.lookAt(0, 0.7, 0);
  },

  close() {
    if (!this.visible) return;
    this.visible = false;
    this._isDragging = false;

    document.body.classList.remove('model-test-active');
    if (this.game) this.game.testRoomActive = false;
    this.overlay.classList.remove('open');
    var panel = document.getElementById('modelTestPanel');
    if (panel) panel.classList.remove('open');
    this.panelOpen = false;
    this._updateShift();
    this.toggleBtn.classList.remove('show');
    var rotRow = document.getElementById('mtRotateRow');
    if (rotRow) rotRow.classList.remove('show');

    plugin.emit('model_test:close');
    if (this._modelWrapper) {
      this.roomGroup.remove(this._modelWrapper);
      this._modelWrapper = null;
    }
    this._clearHighlight();
    this._childMode = false;
    this._childList = null;
    this._subModelMode = false;
    this._subModels = null;
    this._subModelActive = null;
    this.currentModel = null;
    this.currentModelId = null;

    if (this.roomGroup) {
      scene.remove(this.roomGroup);
      this.roomGroup = null;
    }

    // Kaydedilen sahne objelerini geri getir
    if (this._savedChildren) {
      for (var i = 0; i < this._savedChildren.length; i++) {
        scene.add(this._savedChildren[i]);
      }
      this._savedChildren = null;
    }

    scene.background = this._savedBg;
    scene.fog = this._savedFog;

    if (this._savedCamPos) {
      camera.position.copy(this._savedCamPos);
      camera.lookAt(0, 0, 0);
    }

    // Game UI'larını geri getir
    if (this._hudShow) {
      var hud = document.getElementById('hud');
      if (hud) hud.classList.add('show');
    }

    var menuOv = document.querySelector('.menu-overlay');
    if (menuOv) menuOv.classList.remove('hidden');
  },

  destroy() {
    document.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('touchstart', this._onTouchStart);
    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);
    plugin.off('menu:model_test', this.id);
    this.close();
    if (this.overlay) this.overlay.remove();
    plugin.removeStyles(this.id);
  }
});
