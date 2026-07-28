var plugin = include('registry');
var commands = include('commands');
var loader = include('loader');

plugin.register({
  id: 'ui_map_creator',
  name: 'Harita Olusturucu',
  type: 'menu',
  version: '1.0',
  description: 'Kendi haritani olustur, JS olarak kaydet',

  _active: false,
  _models: [],
  _placed: [],
  _selected: null,
  _currentModel: null,
  _scene: null,
  _savedCamState: null,
  _ground: null,
  _grid: null,
  _raycaster: new THREE.Raycaster(),
  _mouse: new THREE.Vector2(),
  _plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  _intersect: new THREE.Vector3(),
  _previewMesh: null,
  _dragStart: null,
  _dragObj: null,
  _dragOffset: new THREE.Vector3(),
  _modelPlugins: [],

  init() {
    var self = this;
    plugin.on('menu:map_creator', this.id, function() {
      self.open();
    });
    if (commands) {
      commands.register('map_creator', 'ui', function(args) {
        if (args[0] === 'open') self.open();
        else self.close();
      });
    }
  },

  open() {
    if (this._active) return;
    this._active = true;
    this._placed = [];
    this._selected = null;
    this._currentModel = null;
    this._previewMesh = null;
    this._modelPlugins = [];

    var game = window.game;
    if (!game || !game.scene) return;
    this._scene = game.scene;

    // Kamerayi kaydet ve editor goruntusune gec
    var mainCam = game.camera;
    this._savedCamState = {
      position: mainCam.position.clone(),
      quaternion: mainCam.quaternion.clone(),
      near: mainCam.near, far: mainCam.far
    };
    mainCam.position.set(15, 25, 15);
    mainCam.lookAt(0, 0, 0);

    game.paused = true;
    this._buildUI();
    this._setupEditorScene();
    this._loadModelList();
  },

  close() {
    if (!this._active) return;
    this._active = false;
    this._cleanupEditorScene();
    this._removeUI();
    var game = window.game;
    if (game) game.paused = false;
  },

  _buildUI() {
    if (this._container) return;
    var self = this;
    var div = document.createElement('div');
    div.id = 'mapCreator';
    div.style.cssText =
      'position:fixed;inset:0;z-index:300;background:#0a0a12;display:flex;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#fff;';
    div.innerHTML =
      '<div id="mcSidebar" style="width:180px;background:#10101a;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;flex-shrink:0;">' +
        '<div style="padding:12px;font-size:13px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.4);">Modeller</div>' +
        '<div id="mcModelList" style="flex:1;overflow-y:auto;padding:8px;"></div>' +
        '<div style="padding:8px;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:4px;">' +
          '<button id="mcSaveBtn" style="background:#c62828;border:none;color:#fff;padding:10px;border-radius:6px;cursor:pointer;font-size:12px;letter-spacing:1px;">HARITAYI KAYDET</button>' +
          '<button id="mcClearBtn" style="background:rgba(255,255,255,.06);border:none;color:rgba(255,255,255,.5);padding:8px;border-radius:6px;cursor:pointer;font-size:11px;">Temizle</button>' +
          '<button id="mcCloseBtn" style="background:rgba(255,255,255,.04);border:none;color:rgba(255,255,255,.3);padding:8px;border-radius:6px;cursor:pointer;font-size:11px;">Cikis</button>' +
        '</div>' +
      '</div>' +
      '<div id="mcViewport" style="flex:1;position:relative;">' +
        '<div id="mcTooltip" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.7);padding:8px 16px;border-radius:6px;font-size:12px;color:rgba(255,255,255,.5);pointer-events:none;white-space:nowrap;">Model secmek icin soldan bir model tikla, zemine tikla yerlestir</div>' +
      '</div>' +
      '<div id="mcProps" style="width:200px;background:#10101a;border-left:1px solid rgba(255,255,255,.06);display:none;flex-direction:column;flex-shrink:0;">' +
        '<div style="padding:12px;font-size:13px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.4);">Ozellikler</div>' +
        '<div id="mcPropBody" style="flex:1;padding:12px;overflow-y:auto;"></div>' +
      '</div>';
    document.body.appendChild(div);
    this._container = div;

    document.getElementById('mcSaveBtn').addEventListener('click', function() { self._saveMap(); });
    document.getElementById('mcClearBtn').addEventListener('click', function() {
      if (confirm('Tum objeleri sil?')) self._clearAll();
    });
    document.getElementById('mcCloseBtn').addEventListener('click', function() { self.close(); });

    document.getElementById('mcModelList').addEventListener('click', function(e) {
      var btn = e.target.closest('.mc-model-btn');
      if (!btn) return;
      self._selectModel(btn.dataset.pluginId);
    });

    this._mcViewport = document.getElementById('mcViewport');
  },

  _removeUI() {
    if (this._container) {
      document.body.removeChild(this._container);
      this._container = null;
    }
    this._mcViewport = null;
  },

  _setupEditorScene() {
    var scene = this._scene;
    this._origFog = scene.fog;
    scene.fog = null;

    var gridMat = new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.3 });
    var gridSize = 30;
    var gridGeo = new THREE.BufferGeometry();
    var pts = [];
    for (var i = -gridSize; i <= gridSize; i++) {
      pts.push(-gridSize, 0, i, gridSize, 0, i);
      pts.push(i, 0, -gridSize, i, 0, gridSize);
    }
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this._grid = new THREE.Lines(gridGeo, gridMat);
    this._grid.name = 'editor_grid';
    scene.add(this._grid);

    var gMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    this._ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), gMat);
    this._ground.rotation.x = -Math.PI / 2;
    this._ground.position.y = -0.01;
    this._ground.name = 'editor_ground';
    scene.add(this._ground);

    var amb = new THREE.AmbientLight(0x446688, 0.6);
    amb.name = 'editor_amb';
    scene.add(amb);
    var dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    dir.name = 'editor_dir';
    scene.add(dir);

    var viewport = this._mcViewport;
    if (viewport) {
      viewport.addEventListener('click', function(e) { self._onViewportClick(e); }.bind(this));
      viewport.addEventListener('mousemove', function(e) { self._onViewportMove(e); }.bind(this));
      viewport.addEventListener('touchstart', function(e) {
        var t = e.changedTouches[0];
        self._onViewportClick({ clientX: t.clientX, clientY: t.clientY });
      }.bind(this), { passive: true });
    }
    var self = this;
  },

  _cleanupEditorScene() {
    var scene = this._scene;
    if (!scene) return;

    // Ana kamerayi geri yukle
    if (this._savedCamState) {
      var mainCam = window.game && window.game.camera;
      if (mainCam) {
        mainCam.position.copy(this._savedCamState.position);
        mainCam.quaternion.copy(this._savedCamState.quaternion);
        mainCam.near = this._savedCamState.near;
        mainCam.far = this._savedCamState.far;
        mainCam.updateProjectionMatrix();
      }
      this._savedCamState = null;
    }

    scene.fog = this._origFog;
    var toRemove = [];
    if (this._grid) { toRemove.push(this._grid); this._grid = null; }
    if (this._ground) { toRemove.push(this._ground); this._ground = null; }
    if (this._previewMesh) { toRemove.push(this._previewMesh); this._previewMesh = null; }
    scene.traverse(function(obj) {
      if (obj.name && (obj.name.indexOf('editor_') === 0 || obj.name.indexOf('mc_') === 0)) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach(function(obj) { scene.remove(obj); });

    this._placed.forEach(function(p) {
      if (p.mesh) scene.remove(p.mesh);
    });
    this._placed = [];
    this._selected = null;
  },

  _loadModelList() {
    var list = document.getElementById('mcModelList');
    if (!list) return;
    var all = plugin.getAll().filter(function(p) { return p.type === 'map_model' && p.enabled; });
    this._modelPlugins = all;

    var self = this;
    all.forEach(function(p) {
      var btn = document.createElement('button');
      btn.className = 'mc-model-btn';
      btn.dataset.pluginId = p.id;
      btn.style.cssText =
        'display:block;width:100%;background:none;border:none;color:rgba(255,255,255,.4);padding:8px 10px;text-align:left;cursor:pointer;font-size:11px;letter-spacing:.5px;border-radius:4px;transition:all .15s;font-family:inherit;';
      btn.textContent = p.name || p.id;
      btn.addEventListener('mouseenter', function() {
        if (!this.classList.contains('active')) this.style.color = 'rgba(255,255,255,.7)';
      });
      btn.addEventListener('mouseleave', function() {
        if (!this.classList.contains('active')) this.style.color = 'rgba(255,255,255,.4)';
      });
      list.appendChild(btn);
    });
  },

  _selectModel(pluginId) {
    var p = plugin.get(pluginId);
    if (!p || !p.createModel) return;
    this._currentModel = p;

    // Preview mesh olustur
    if (this._previewMesh) { this._scene.remove(this._previewMesh); this._previewMesh = null; }
    try {
      var previewResult = p.createModel({});
      if (previewResult && previewResult.mesh) {
        this._previewMesh = previewResult.mesh;
        this._previewMesh.position.set(0, -10, 0);
        this._previewMesh.name = 'mc_preview';
        this._scene.add(this._previewMesh);
      }
    } catch (e) {}

    var list = document.getElementById('mcModelList');
    if (list) {
      list.querySelectorAll('.mc-model-btn').forEach(function(b) {
        b.classList.remove('active');
        b.style.background = 'none';
        b.style.color = 'rgba(255,255,255,.4)';
      });
      var btn = list.querySelector('[data-plugin-id="' + pluginId + '"]');
      if (btn) {
        btn.classList.add('active');
        btn.style.background = 'rgba(198,40,40,.15)';
        btn.style.color = '#ef5350';
      }
    }
    var tooltip = document.getElementById('mcTooltip');
    if (tooltip) tooltip.textContent = 'Mod: ' + (p.name || p.id) + ' — zemine tikla yerlestir';
  },

  _onViewportClick(e) {
    var cam = window.game && window.game.camera;
    if (!this._scene || !cam) return;
    var rect = this._mcViewport.getBoundingClientRect();
    this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, cam);
    var hits = this._raycaster.intersectObjects(this._placed.map(function(p) { return p.mesh; }));

    if (hits.length > 0) {
      var hitObj = hits[0].object;
      var found = null;
      for (var i = 0; i < this._placed.length; i++) {
        if (this._placed[i].mesh === hitObj || this._placed[i].mesh.children.indexOf(hitObj) !== -1) {
          found = this._placed[i];
          break;
        }
      }
      if (found) {
        this._selectObject(found);
        return;
      }
    }

    var planeHit = this._raycaster.intersectObject(this._ground);
    if (planeHit && this._currentModel) {
      var pos = planeHit[0].point;
      pos.y = 0;
      this._placeObject(this._currentModel, pos);
    }
  },

  _onViewportMove(e) {
    var cam = window.game && window.game.camera;
    if (!this._scene || !cam || !this._mcViewport) return;
    var rect = this._mcViewport.getBoundingClientRect();
    this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, cam);

    var planeHit = this._raycaster.intersectObject(this._ground);
    if (planeHit && this._currentModel && this._previewMesh) {
      var pos = planeHit[0].point;
      pos.y = 0;
      this._previewMesh.position.copy(pos);
    }
  },

  _placeObject(modelPlugin, position) {
    var config = { position: [position.x, position.y, position.z] };
    if (modelPlugin.id.indexOf('map_ground') !== -1) config.size = 60;
    if (modelPlugin.id.indexOf('map_sun') !== -1) {
      config.targetX = 0; config.targetZ = 0; config.intensity = 1.3; config.shadowSize = 35;
    }
    if (modelPlugin.id.indexOf('map_moon') !== -1) {
      config.targetX = 0; config.targetZ = 0; config.intensity = 0.7; config.shadowSize = 35;
    }

    var result;
    try {
      result = modelPlugin.createModel(config);
    } catch (e) { console.warn('[MapCreator]', e); return; }
    if (!result || !result.mesh) return;
    var mesh = result.mesh;
    this._scene.add(mesh);

    var entry = { pluginId: modelPlugin.id, config: config, mesh: mesh, result: result };
    this._placed.push(entry);
    this._selectObject(entry);

    var tooltip = document.getElementById('mcTooltip');
    if (tooltip) tooltip.textContent = (modelPlugin.name || modelPlugin.id) + ' yerlestirildi';
    setTimeout(function() {
      if (tooltip && tooltip.textContent.indexOf('yerlestirildi') !== -1)
        tooltip.textContent = 'Objeyi secmek icin uzerine tikla, suruklemek icin surukle';
    }, 1500);
  },

  _selectObject(entry) {
    this._selected = entry;
    this._deselectAll();
    entry.mesh.traverse(function(obj) {
      if (obj.isMesh) {
        obj.material = obj.material.clone();
        obj.material.emissive = new THREE.Color(0x4488ff);
        obj.material.emissiveIntensity = 0.15;
      }
    });
    this._showProps(entry);
  },

  _deselectAll() {
    this._placed.forEach(function(p) {
      p.mesh.traverse(function(obj) {
        if (obj.isMesh && obj.material) {
          if (obj.material._origColor) {
            obj.material.color.copy(obj.material._origColor);
            obj.material._origColor = null;
          }
          obj.material.emissive = new THREE.Color(0x000000);
          obj.material.emissiveIntensity = 0;
        }
      });
    });
  },

  _showProps(entry) {
    var panel = document.getElementById('mcProps');
    var body = document.getElementById('mcPropBody');
    if (!panel || !body) return;
    panel.style.display = 'flex';

    var p = plugin.get(entry.pluginId);
    var name = p ? p.name || p.id : entry.pluginId;
    var cfg = entry.config;
    var pos = cfg.position || [0, 0, 0];

    body.innerHTML =
      '<div style="font-size:13px;font-weight:600;margin-bottom:10px;">' + name + '</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,.3);margin-bottom:12px;">' + entry.pluginId + '</div>' +
      '<label style="display:block;font-size:11px;color:rgba(255,255,255,.4);margin-bottom:4px;">X</label>' +
      '<input id="mcPropX" type="range" min="-30" max="30" step="0.5" value="' + pos[0] + '" style="width:100%;">' +
      '<div style="font-size:10px;color:rgba(255,255,255,.2);text-align:right;margin-bottom:8px;">' + pos[0].toFixed(1) + '</div>' +
      '<label style="display:block;font-size:11px;color:rgba(255,255,255,.4);margin-bottom:4px;">Z</label>' +
      '<input id="mcPropZ" type="range" min="-30" max="30" step="0.5" value="' + pos[2] + '" style="width:100%;">' +
      '<div style="font-size:10px;color:rgba(255,255,255,.2);text-align:right;margin-bottom:8px;">' + pos[2].toFixed(1) + '</div>' +
      '<hr style="border:none;border-top:1px solid rgba(255,255,255,.06);margin:10px 0;">' +
      '<button id="mcDeleteBtn" style="background:rgba(198,40,40,.2);border:1px solid rgba(198,40,40,.3);color:#ef5350;padding:8px;border-radius:6px;cursor:pointer;font-size:11px;width:100%;">Objeyi Sil</button>';

    var self = this;
    document.getElementById('mcPropX').addEventListener('input', function() {
      pos[0] = parseFloat(this.value);
      entry.mesh.position.x = pos[0];
      var lbl = this.nextElementSibling;
      if (lbl) lbl.textContent = pos[0].toFixed(1);
    });
    document.getElementById('mcPropZ').addEventListener('input', function() {
      pos[2] = parseFloat(this.value);
      entry.mesh.position.z = pos[2];
      var lbl = this.nextElementSibling;
      if (lbl) lbl.textContent = pos[2].toFixed(1);
    });
    document.getElementById('mcDeleteBtn').addEventListener('click', function() {
      self._deleteObject(entry);
    });
  },

  _deleteObject(entry) {
    var idx = this._placed.indexOf(entry);
    if (idx === -1) return;
    if (entry.mesh) this._scene.remove(entry.mesh);
    this._placed.splice(idx, 1);
    if (this._selected === entry) {
      this._selected = null;
      var panel = document.getElementById('mcProps');
      if (panel) panel.style.display = 'none';
    }
  },

  _clearAll() {
    this._placed.forEach(function(p) {
      if (p.mesh) this._scene.remove(p.mesh);
    }.bind(this));
    this._placed = [];
    this._selected = null;
    var panel = document.getElementById('mcProps');
    if (panel) panel.style.display = 'none';
  },

  _saveMap() {
    var mapId = 'map_custom_' + Date.now().toString(36);
    var mapName = prompt('Harita adi:', 'Custom Map') || 'Custom Map';
    var desc = prompt('Harita aciklamasi:', 'Custom created map') || 'Custom created map';

    var usedPlugins = [];
    var pluginSet = {};
    this._placed.forEach(function(p) {
      if (!pluginSet[p.pluginId]) {
        pluginSet[p.pluginId] = true;
        usedPlugins.push(p.pluginId);
      }
    });
    if (!pluginSet['map_skybox_day'] && !pluginSet['map_skybox_night']) {
      usedPlugins.push('map_skybox_day');
    }

    var code = 'var plugin = include(\'registry\');\n';
    code += 'var loader = include(\'loader\');\n\n';
    code += 'plugin.register({\n';
    code += '  id: \'' + mapId + '\',\n';
    code += '  name: \'' + mapName + '\',\n';
    code += '  version: \'1.0\',\n';
    code += '  type: \'scene\',\n';
    code += '  description: \'' + desc + '\',\n\n';
    code += '  game: null,\n  objects: [],\n  colliders: [],\n';
    code += '  _ready: false,\n  _depCount: 0,\n  _depLoaded: 0,\n';
    code += '  _modelPaths: ' + JSON.stringify(usedPlugins) + ',\n\n';
    code += '  init(game) {\n';
    code += '    this.game = game;\n    this.objects = [];\n    this.colliders = [];\n    this._ready = false;\n';
    code += '    this._depCount = 0;\n    this._depLoaded = 0;\n';
    code += '    var self = this;\n';
    code += '    this._depCount = this._modelPaths.length;\n    this._depLoaded = 0;\n';
    code += '    this._modelPaths.forEach(function(path) {\n';
    code += '      loader.loadScript(path, function(err) {\n';
    code += '        if (err) console.warn(\'[' + mapId + ']\', err);\n';
    code += '        self._depLoaded++;\n      });\n    });\n';
    code += '    if (!game.currentMap || game.currentMap.id !== \'' + mapId + '\') return;\n  },\n\n';
    code += '  update(dt) {\n';
    code += '    if (this._ready) return;\n    if (this._depLoaded < this._depCount) return;\n';
    code += '    if (!this.game || !this.game.currentMap || this.game.currentMap.id !== \'' + mapId + '\') return;\n';
    code += '    this._ready = true;\n    this._buildMap();\n  },\n\n';
    code += '  _buildMap: function() {\n';
    code += '    var scene = this.game.scene;\n    var self = this;\n\n';
    code += '    function addModel(pluginId, config) {\n';
    code += '      var p = plugin.get(pluginId);\n';
    code += '      if (!p || !p.enabled || typeof p.createModel !== \'function\') {\n';
    code += '        if (!p) console.warn(\'[' + mapId + ']\', \'Model bulunamadi:\', pluginId);\n';
    code += '        return;\n      }\n      try {\n';
    code += '        var result = p.createModel(config);\n        if (result && result.mesh) {\n';
    code += '          scene.add(result.mesh);\n          self.objects.push(result.mesh);\n';
    code += '          if (result.colliders) {\n';
    code += '            result.colliders.forEach(function(c) { self.colliders.push(c); });\n          }\n        }\n';
    code += '      } catch (e) {\n        console.warn(\'[' + mapId + ']\', \'Model yukleme hatasi:\', pluginId, e);\n      }\n    }\n\n';

    this._placed.forEach(function(p) {
      var cfg = JSON.parse(JSON.stringify(p.config));
      code += '    addModel(\'' + p.pluginId + '\', ' + JSON.stringify(cfg) + ');\n';
    });
    code += '\n  },\n\n';

    code += '  getMapConfig: function() {\n';
    code += '    return {\n';
    code += '      id: \'' + mapId + '\',\n';
    code += '      name: \'' + mapName + '\',\n';
    code += '      mode: \'normal\',\n';
    code += '      modeDescription: \'' + desc + '\',\n';
    code += '      playerSpawn: [0, 0.5, 0],\n';
    code += '      zombieSpawns: [\n';
    code += '        [8, 0, 8], [-8, 0, -8],\n        [8, 0, -8], [-8, 0, 8],\n';
    code += '        [12, 0, 0], [-12, 0, 0],\n        [0, 0, 12], [0, 0, -12]\n      ],\n';
    code += '      thumbnailCamera: { position: [0, 22, 22], target: [0, 0, 0] },\n';
    code += '      dropbox: {\n        zones: [{ center: [0, 0, 0], radius: 6 }],\n';
    code += '        dropInterval: 45,\n        fallSpeed: 2.5,\n        minHeight: 16\n      }\n    };\n  },\n\n';

    code += '  getIntroData: function() {\n';
    code += '    return {\n      cameraPath: [\n';
    code += '        { pos: [0, 0.6, 10], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 },\n';
    code += '        { pos: [10, 0.6, 5], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 }\n      ]\n    };\n  },\n\n';

    code += '  buildThumbnail: function(targetScene, callback) {\n';
    code += '    var self = this;\n';
    code += '    function addModel(pluginId, config) {\n';
    code += '      var p = plugin.get(pluginId);\n';
    code += '      if (!p || !p.enabled || typeof p.createModel !== \'function\') return;\n';
    code += '      try {\n        var result = p.createModel(config);\n';
    code += '        if (result && result.mesh) targetScene.add(result.mesh);\n      } catch (e) {}\n    }\n\n';
    this._placed.forEach(function(p) {
      var cfg = JSON.parse(JSON.stringify(p.config));
      code += '    addModel(\'' + p.pluginId + '\', ' + JSON.stringify(cfg) + ');\n';
    });
    code += '    callback();\n  },\n\n';

    code += '  getColliders: function() { return this.colliders; },\n\n';
    code += '  destroy() {\n';
    code += '    var scene = this.game ? this.game.scene : null;\n    if (!scene) return;\n';
    code += '    this.objects.forEach(function(obj) { scene.remove(obj); });\n';
    code += '    this.objects = [];\n    this.colliders = [];\n  }\n';
    code += '});\n';

    var blob = new Blob([code], { type: 'application/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = mapId + '.js';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    var tooltip = document.getElementById('mcTooltip');
    if (tooltip) tooltip.textContent = 'Harita kaydedildi: ' + mapId + '.js';
  },

  destroy() {
    this.close();
    plugin.off('menu:map_creator', this.id);
    if (commands) commands.unregister('map_creator');
  }
});
