PluginRegistry.register({
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
    'body.model-test-active #levelContainer,body.model-test-active #joystick-area,body.model-test-active .pause-overlay,body.model-test-active #gameOver{display:none!important;}' +
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
    '.mt-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;padding:10px 0 6px;border-bottom:1px solid rgba(255,255,255,0.04);margin-bottom:4px;}',

  visible: false,
  panelOpen: false,
  roomGroup: null,
  currentModel: null,
  currentModelId: null,
  overlay: null,
  listEl: null,
  toggleBtn: null,
  _previews: null,

  _savedBg: null,
  _savedFog: null,
  _savedCamPos: null,

  init(game) {
    this.game = game;

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'modelTestOverlay';
    overlay.innerHTML =
      '<div id="modelTestPanel">' +
        '<div class="mt-header">' +
          '<h2>Modeller</h2>' +
          '<span class="mt-close" id="mtClose">Gizle</span>' +
        '</div>' +
        '<div class="mt-label" style="padding-left:12px;padding-top:12px;">Yüklü Modeller</div>' +
        '<div id="modelTestList"></div>' +
        '<div id="modelTestExtra"></div>' +
        '<button id="mtBackBtn">ANA MENÜ</button>' +
      '</div>';
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.listEl = document.getElementById('modelTestList');

    var self = this;
    document.getElementById('mtClose').addEventListener('click', function() { self.hidePanel(); });
    document.getElementById('mtBackBtn').addEventListener('click', function() { self.close(); });

    // Toggle button
    this.toggleBtn = document.getElementById('modelTestToggle');
    this.toggleBtn.addEventListener('click', function() {
      if (self.panelOpen) self.hidePanel(); else self.showPanel();
    });

    PluginRegistry.on('menu:model_test', this.id, function() { self.open(); });
  },

  open() {
    if (this.visible) return;
    this.visible = true;

    // Game UI'larını gizle (CSS ile)
    document.body.classList.add('model-test-active');
    if (this.game) this.game.testRoomActive = true;
    var hud = document.getElementById('hud');
    if (hud) { this._hudShow = hud.classList.contains('show'); hud.classList.remove('show'); }
    var ch = document.getElementById('crosshair');
    if (ch) { this._chShow = ch.style.display !== 'none'; ch.style.display = 'none'; }

    // Scene state
    this._savedBg = scene.background;
    this._savedFog = scene.fog;
    scene.background = new THREE.Color(0x0d0d14);
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

    this.roomGroup.add(new THREE.AmbientLight(0x404060, 0.4));
    var dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(5, 12, 5);
    dl.castShadow = true;
    this.roomGroup.add(dl);
    var fl = new THREE.DirectionalLight(0x8888ff, 0.3);
    fl.position.set(-4, 6, -4);
    this.roomGroup.add(fl);
    var bl = new THREE.PointLight(0x4fc3f7, 0.2, 8);
    bl.position.set(0, 0.5, 0);
    this.roomGroup.add(bl);

    scene.add(this.roomGroup);

    // Camera
    this._savedCamPos = camera.position.clone();
    camera.position.set(0, 3.5, 6.5);
    camera.lookAt(0, 0.6, 0);

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

    PluginRegistry.emit('model_test:open');
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
    var models = PluginRegistry.getByType('model');
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
    var models = PluginRegistry.getByType('model');
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

    var modelDef = PluginRegistry.get(id);
    if (!modelDef || !modelDef.enabled || typeof modelDef.createModel !== 'function') return;

    var mesh = modelDef.createModel();
    var wrapper = new THREE.Group();

    // Boyutu normalize et (scale, mesh.position'u degistirme)
    var box = new THREE.Box3().setFromObject(mesh);
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      var targetSize = 1.2;
      var scale = targetSize / maxDim;
      mesh.scale.set(scale, scale, scale);
    }

    wrapper.add(mesh);
    wrapper.position.y = 0.4;
    this.roomGroup.add(wrapper);
    this._modelWrapper = wrapper;
    this.currentModel = mesh;

    var cards = this.listEl.querySelectorAll('.mt-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('active', cards[i].dataset.modelId === id);
    }

    PluginRegistry.emit('model_test:select', { modelId: id, modelDef: modelDef, mesh: mesh });
  },

  update(dt) {
    if (!this.visible) return;
    if (this.currentModel) {
      this.currentModel.rotation.y += dt * 0.4;
    }
    camera.lookAt(0, 0.6, 0);
  },

  close() {
    if (!this.visible) return;
    this.visible = false;

    document.body.classList.remove('model-test-active');
    if (this.game) this.game.testRoomActive = false;
    this.overlay.classList.remove('open');
    var panel = document.getElementById('modelTestPanel');
    if (panel) panel.classList.remove('open');
    this.panelOpen = false;
    this._updateShift();
    this.toggleBtn.classList.remove('show');

    PluginRegistry.emit('model_test:close');
    if (this._modelWrapper) {
      this.roomGroup.remove(this._modelWrapper);
      this._modelWrapper = null;
    }
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
    if (this._chShow) {
      var ch = document.getElementById('crosshair');
      if (ch) ch.style.display = '';
    }

    var menuOv = document.querySelector('.menu-overlay');
    if (menuOv) menuOv.classList.remove('hidden');
  },

  destroy() {
    PluginRegistry.off('menu:model_test', this.id);
    this.close();
    if (this.overlay) this.overlay.remove();
    PluginRegistry.removeStyles(this.id);
  }
});
