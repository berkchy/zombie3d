var plugin = include('registry');
var commands = include('commands');
var loader = include('loader');

var _MODEL_NAMES = [
  'map_ground', 'map_platform', 'map_pillar', 'map_ruins',
  'map_torch', 'map_wall', 'map_sun', 'map_moon',
  'map_night_ground', 'map_night_brazier', 'map_night_statue',
  'map_night_crypt', 'map_night_lantern_post', 'map_night_tree',
  'map_skybox_day', 'map_skybox_night'
];

plugin.register({
  id: 'ui_map_creator',
  name: 'Harita Olusturucu',
  type: 'menu',
  version: '1.0',
  description: 'Kendi haritani olustur, JS olarak kaydet',

  _active: false,
  _placed: [],
  _selected: null,
  _currentPluginId: null,
  _scene: null,
  _savedCamState: null,
  _ground: null,
  _grid: null,
  _raycaster: new THREE.Raycaster(),
  _mouse: new THREE.Vector2(),
  _previewMesh: null,
  _loaded: 0,
  _loading: false,

  init() {
    var self = this;
    plugin.on('menu:map_creator', this.id, function() { self.open(); });
  },

  open() {
    if (this._active) return;
    this._active = true;
    this._placed = [];
    this._selected = null;
    this._currentPluginId = null;

    var game = window.game;
    if (!game || !game.scene) return;
    this._scene = game.scene;

    var mbg = plugin.get('fx_menu_background');
    if (mbg && mbg.hide) mbg.hide();

    var cam = game.camera;
    this._savedCamState = {
      position: cam.position.clone(),
      quaternion: cam.quaternion.clone()
    };
    cam.position.set(18, 22, 18);
    cam.lookAt(0, 0, 0);

    window._mapCreatorActive = true;
    game.paused = true;

    this._buildUI();
    this._setupScene();
    this._preloadModels();
  },

  close() {
    if (!this._active) return;
    this._active = false;
    window._mapCreatorActive = false;

    var game = window.game;
    if (game) game.paused = false;

    var mbg = plugin.get('fx_menu_background');
    if (mbg && mbg.show) mbg.show();

    if (this._savedCamState) {
      var cam = game && game.camera;
      if (cam) {
        cam.position.copy(this._savedCamState.position);
        cam.quaternion.copy(this._savedCamState.quaternion);
        cam.updateProjectionMatrix();
      }
      this._savedCamState = null;
    }

    this._cleanupScene();
    this._removeUI();
    plugin.emit('menu:return');
  },

  // ---------- UI ----------

  _buildUI() {
    if (this._container) return;
    var self = this;

    // Sidebar
    var sb = document.createElement('div');
    sb.id = 'mcSidebar';
    sb.style.cssText = 'position:fixed;left:0;top:0;bottom:0;width:180px;background:#0e0e18;z-index:500;display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.06);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#fff;';
    sb.innerHTML =
      '<div style="padding:12px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.3);border-bottom:1px solid rgba(255,255,255,.06);">Modeller</div>' +
      '<div id="mcModelList" style="flex:1;overflow-y:auto;padding:6px;"></div>' +
      '<div style="padding:8px;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:4px;">' +
        '<button id="mcSaveBtn" style="background:#c62828;border:none;color:#fff;padding:9px;border-radius:5px;cursor:pointer;font-size:11px;letter-spacing:1px;">HARITAYI KAYDET</button>' +
        '<button id="mcClearBtn" style="background:rgba(255,255,255,.06);border:none;color:rgba(255,255,255,.4);padding:7px;border-radius:5px;cursor:pointer;font-size:10px;">Temizle</button>' +
        '<button id="mcCloseBtn" style="background:rgba(255,255,255,.03);border:none;color:rgba(255,255,255,.25);padding:7px;border-radius:5px;cursor:pointer;font-size:10px;">Cikis</button>' +
      '</div>';
    document.body.appendChild(sb);

    // Properties
    var props = document.createElement('div');
    props.id = 'mcProps';
    props.style.cssText = 'position:fixed;right:0;top:0;bottom:0;width:200px;background:#0e0e18;z-index:500;display:none;flex-direction:column;border-left:1px solid rgba(255,255,255,.06);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#fff;';
    props.innerHTML =
      '<div style="padding:12px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.3);border-bottom:1px solid rgba(255,255,255,.06);">Ozellikler</div>' +
      '<div id="mcPropBody" style="flex:1;padding:12px;overflow-y:auto;font-size:12px;"></div>';
    document.body.appendChild(props);

    // Tooltip
    var tip = document.createElement('div');
    tip.id = 'mcTip';
    tip.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:500;background:rgba(0,0,0,.7);padding:8px 18px;border-radius:6px;color:rgba(255,255,255,.5);font-size:12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;pointer-events:none;white-space:nowrap;';
    tip.textContent = 'Soldan model sec, zemine tikla yerlestir';
    document.body.appendChild(tip);

    this._container = sb;

    document.getElementById('mcSaveBtn').addEventListener('click', function() { self._save(); });
    document.getElementById('mcClearBtn').addEventListener('click', function() {
      if (confirm('Tum objeleri sil?')) self._clearAll();
    });
    document.getElementById('mcCloseBtn').addEventListener('click', function() { self.close(); });

    document.addEventListener('keydown', this._onKey = function(e) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (self._selected) self._deleteSelected();
      }
      if (e.key === 'Escape') self.close();
    });

    this._viewportEl = document.body;
  },

  _removeUI() {
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
    ['mcSidebar', 'mcProps', 'mcTip'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) document.body.removeChild(el);
    });
    this._container = null;
    this._viewportEl = null;
  },

  _setTip(msg) {
    var el = document.getElementById('mcTip');
    if (el) el.textContent = msg;
  },

  // ---------- Scene ----------

  _setupScene() {
    var scene = this._scene;
    var gMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.85, side: THREE.DoubleSide });
    this._ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), gMat);
    this._ground.rotation.x = -Math.PI / 2;
    this._ground.position.y = -0.01;
    this._ground.name = 'mc_ground';
    scene.add(this._ground);

    var gridMat = new THREE.LineBasicMaterial({ color: 0x2a3a5a, transparent: true, opacity: 0.25 });
    var gs = 30;
    var pts = [];
    for (var i = -gs; i <= gs; i++) {
      pts.push(-gs, 0, i, gs, 0, i);
      pts.push(i, 0, -gs, i, 0, gs);
    }
    var gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this._grid = new THREE.Lines(gridGeo, gridMat);
    this._grid.name = 'mc_grid';
    scene.add(this._grid);

    var amb = new THREE.AmbientLight(0x446688, 0.5);
    amb.name = 'mc_amb';
    scene.add(amb);
    var dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(10, 20, 10);
    dir.name = 'mc_dir';
    scene.add(dir);

    // Click events
    document.addEventListener('click', this._onClick = function(e) {
      if (e.target.closest('#mcSidebar') || e.target.closest('#mcProps')) return;
      self._onViewportClick(e);
    }.bind(this));
    document.addEventListener('mousemove', this._onMove = function(e) {
      self._onViewportMove(e);
    }.bind(this));
  },

  _cleanupScene() {
    var scene = this._scene;
    if (!scene) return;
    var toRemove = [];
    scene.traverse(function(o) {
      if (o.name && o.name.indexOf('mc_') === 0) toRemove.push(o);
    });
    toRemove.forEach(function(o) { scene.remove(o); });
    this._placed.forEach(function(p) { if (p.mesh) scene.remove(p.mesh); });
    this._placed = [];
    this._selected = null;
    if (this._previewMesh) { scene.remove(this._previewMesh); this._previewMesh = null; }
    if (this._onClick) document.removeEventListener('click', this._onClick);
    if (this._onMove) document.removeEventListener('mousemove', this._onMove);
  },

  // ---------- Models ----------

  _preloadModels() {
    if (this._loading) return;
    this._loading = true;
    this._loaded = 0;
    var total = _MODEL_NAMES.length;
    var self = this;

    _MODEL_NAMES.forEach(function(name) {
      loader.loadScript(name, function() {
        self._loaded++;
        if (self._loaded >= total) {
          self._loading = false;
          self._populateList();
        }
      });
    });
    loader.startSubQueue();
  },

  _modelIcon(id) {
    var colors = {
      ground: '#6a7a8a', night_ground: '#3a4a5a',
      skybox_day: '#4a8aca', skybox_night: '#2a3a6a',
      sun: '#ffaa44', moon: '#8899cc',
      platform: '#5a6a5a', pillar: '#6a5a4a', ruins: '#7a6a5a', wall: '#5a5a5a',
      torch: '#cc6622', night_brazier: '#ff5500', night_lantern_post: '#ffaa33',
      night_crypt: '#5a4a4a', night_statue: '#4a4a5a', night_tree: '#3a3a2a'
    };
    for (var k in colors) {
      if (id.indexOf(k) !== -1) return colors[k];
    }
    return '#555566';
  },

  _makeThumbnail(id, name) {
    var c = document.createElement('canvas');
    c.width = 36;
    c.height = 36;
    var ctx = c.getContext('2d');
    var color = this._modelIcon(id);
    ctx.beginPath();
    ctx.arc(18, 18, 14, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    var letter = (name || id).charAt(0).toUpperCase();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 18, 18);
    return c;
  },

  _populateList() {
    var list = document.getElementById('mcModelList');
    if (!list) return;
    list.innerHTML = '';

    var order = ['map_ground', 'map_night_ground', 'map_skybox_day', 'map_skybox_night',
      'map_sun', 'map_moon',
      'map_platform', 'map_pillar', 'map_ruins', 'map_wall',
      'map_torch', 'map_night_brazier', 'map_night_lantern_post',
      'map_night_crypt', 'map_night_statue', 'map_night_tree'];

    var seen = {};
    var all = plugin.getAll().filter(function(p) { return p.type === 'map_model' && p.enabled; });
    var sorted = [];
    order.forEach(function(id) {
      var p = plugin.get(id);
      if (p && seen[id]) return;
      if (p) { sorted.push(p); seen[id] = true; }
    });
    all.forEach(function(p) {
      if (!seen[p.id]) sorted.push(p);
    });

    var self = this;
    sorted.forEach(function(p) {
      var card = document.createElement('div');
      card.setAttribute('data-mid', p.id);
      card.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 8px;margin:2px 0;cursor:pointer;border-radius:5px;transition:all .12s;border:1px solid transparent;';
      card.style.background = 'rgba(255,255,255,.02)';

      var thumb = self._makeThumbnail(p.id, p.name);
      thumb.style.cssText = 'border-radius:4px;flex-shrink:0;';
      card.appendChild(thumb);

      var label = document.createElement('div');
      label.style.cssText = 'font-size:11px;color:rgba(255,255,255,.35);line-height:1.2;flex:1;';
      label.textContent = p.name || p.id;
      card.appendChild(label);

      card.addEventListener('mouseenter', function() {
        if (!this.dataset.active) {
          this.style.background = 'rgba(255,255,255,.06)';
          this.style.borderColor = 'rgba(255,255,255,.08)';
        }
      });
      card.addEventListener('mouseleave', function() {
        if (!this.dataset.active) {
          this.style.background = 'rgba(255,255,255,.02)';
          this.style.borderColor = 'transparent';
        }
      });
      card.addEventListener('click', function() {
        list.querySelectorAll('[data-mid]').forEach(function(c) {
          c.dataset.active = '';
          c.style.background = 'rgba(255,255,255,.02)';
          c.style.borderColor = 'transparent';
          var t = c.querySelector('canvas');
          if (t) t.style.boxShadow = 'none';
        });
        this.dataset.active = '1';
        this.style.background = 'rgba(198,40,40,.12)';
        this.style.borderColor = 'rgba(198,40,40,.25)';
        var t = this.querySelector('canvas');
        if (t) t.style.boxShadow = '0 0 6px rgba(198,40,40,.3)';
        self._selectModel(p.id);
      });
      list.appendChild(card);
    });
  },

  _selectModel(pluginId) {
    this._currentPluginId = pluginId;

    if (this._previewMesh) { this._scene.remove(this._previewMesh); this._previewMesh = null; }
    var p = plugin.get(pluginId);
    if (p && p.createModel) {
      try {
        var r = p.createModel({});
        if (r && r.mesh) {
          this._previewMesh = r.mesh;
          this._previewMesh.position.set(0, -10, 0);
          this._previewMesh.name = 'mc_preview';
          this._scene.add(this._previewMesh);
        }
      } catch (e) {}
    }
    this._setTip('Mod: ' + (p ? p.name || p.id : pluginId) + ' — zemine tikla yerlestir');
  },

  // ---------- Interaction ----------

  _getMouseUV(e) {
    return {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1
    };
  },

  _onViewportClick(e) {
    var cam = window.game && window.game.camera;
    if (!this._scene || !cam || !this._currentPluginId) return;
    var uv = this._getMouseUV(e);
    this._raycaster.setFromCamera(new THREE.Vector2(uv.x, uv.y), cam);

    // Check placed objects
    var hits = this._raycaster.intersectObjects(this._placed.map(function(p) { return p.mesh; }));
    if (hits.length > 0) {
      var hit = hits[0].object;
      for (var i = 0; i < this._placed.length; i++) {
        var p = this._placed[i];
        if (p.mesh === hit || p.mesh.children.indexOf(hit) !== -1) {
          this._selectObject(p);
          return;
        }
      }
    }

    // Place on ground
    var gh = this._raycaster.intersectObject(this._ground);
    if (gh && gh.length > 0) {
      var pos = gh[0].point;
      pos.y = 0;
      this._placeObject(this._currentPluginId, pos);
    }
  },

  _onViewportMove(e) {
    if (!this._currentPluginId || !this._previewMesh) return;
    var cam = window.game && window.game.camera;
    if (!this._scene || !cam) return;
    var uv = this._getMouseUV(e);
    this._raycaster.setFromCamera(new THREE.Vector2(uv.x, uv.y), cam);
    var gh = this._raycaster.intersectObject(this._ground);
    if (gh && gh.length > 0) {
      this._previewMesh.position.copy(gh[0].point);
      this._previewMesh.position.y = 0;
    }
  },

  // ---------- Object Management ----------

  _placeObject(pluginId, position) {
    var p = plugin.get(pluginId);
    if (!p || !p.createModel) return;

    var cfg = { position: [Math.round(position.x * 2) / 2, 0, Math.round(position.z * 2) / 2] };
    if (pluginId.indexOf('ground') !== -1) cfg.size = 60;
    if (pluginId === 'map_sun') { cfg.targetX = 0; cfg.targetZ = 0; cfg.intensity = 1.3; cfg.shadowSize = 35; }
    if (pluginId === 'map_moon') { cfg.targetX = 0; cfg.targetZ = 0; cfg.intensity = 0.7; cfg.shadowSize = 35; }

    var result;
    try { result = p.createModel(cfg); } catch (e) { return; }
    if (!result || !result.mesh) return;

    this._scene.add(result.mesh);
    var entry = { pluginId: pluginId, config: cfg, mesh: result.mesh };
    this._placed.push(entry);
    this._selectObject(entry);
    this._setTip((p.name || p.id) + ' yerlestirildi (x=' + cfg.position[0] + ', z=' + cfg.position[2] + ')');
  },

  _selectObject(entry) {
    this._deselectAll();
    this._selected = entry;
    entry.mesh.traverse(function(o) {
      if (o.isMesh && o.material) {
        if (!o.material._origEmissive) o.material._origEmissive = o.material.emissive ? o.material.emissive.clone() : new THREE.Color(0);
        o.material.emissive = new THREE.Color(0x4488ff);
        o.material.emissiveIntensity = 0.2;
      }
    });
    this._showProps(entry);
  },

  _deselectAll() {
    if (this._selected) {
      this._selected.mesh.traverse(function(o) {
        if (o.isMesh && o.material) {
          o.material.emissive = o.material._origEmissive || new THREE.Color(0);
          o.material.emissiveIntensity = 0;
        }
      });
    }
    this._selected = null;
    var props = document.getElementById('mcProps');
    if (props) props.style.display = 'none';
  },

  _showProps(entry) {
    var props = document.getElementById('mcProps');
    var body = document.getElementById('mcPropBody');
    if (!props || !body) return;
    props.style.display = 'flex';

    var p = plugin.get(entry.pluginId);
    var name = p ? p.name || p.id : entry.pluginId;
    var cfg = entry.config;
    var pos = cfg.position || [0, 0, 0];

    body.innerHTML =
      '<div style="font-weight:600;margin-bottom:4px;">' + name + '</div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,.3);margin-bottom:12px;">' + entry.pluginId + '</div>' +
      '<label style="font-size:10px;color:rgba(255,255,255,.4);">X</label>' +
      '<input id="mcPX" type="range" min="-28" max="28" step="0.5" value="' + pos[0] + '" style="width:100%;">' +
      '<div style="font-size:10px;color:rgba(255,255,255,.2);text-align:right;margin-bottom:6px;">' + pos[0].toFixed(1) + '</div>' +
      '<label style="font-size:10px;color:rgba(255,255,255,.4);">Z</label>' +
      '<input id="mcPZ" type="range" min="-28" max="28" step="0.5" value="' + pos[2] + '" style="width:100%;">' +
      '<div style="font-size:10px;color:rgba(255,255,255,.2);text-align:right;margin-bottom:6px;">' + pos[2].toFixed(1) + '</div>' +
      '<hr style="border:none;border-top:1px solid rgba(255,255,255,.06);margin:8px 0;">' +
      '<button id="mcDelBtn" style="background:rgba(198,40,40,.15);border:1px solid rgba(198,40,40,.25);color:#ef5350;padding:7px;border-radius:5px;cursor:pointer;font-size:11px;width:100%;">Objeyi Sil</button>';

    var self = this;
    document.getElementById('mcPX').addEventListener('input', function() {
      pos[0] = parseFloat(this.value);
      entry.mesh.position.x = pos[0];
      var l = this.nextElementSibling;
      if (l) l.textContent = pos[0].toFixed(1);
    });
    document.getElementById('mcPZ').addEventListener('input', function() {
      pos[2] = parseFloat(this.value);
      entry.mesh.position.z = pos[2];
      var l = this.nextElementSibling;
      if (l) l.textContent = pos[2].toFixed(1);
    });
    document.getElementById('mcDelBtn').addEventListener('click', function() { self._deleteObject(entry); });
  },

  _deleteObject(entry) {
    var idx = this._placed.indexOf(entry);
    if (idx === -1) return;
    if (entry.mesh) this._scene.remove(entry.mesh);
    this._placed.splice(idx, 1);
    if (this._selected === entry) this._deselectAll();
  },

  _deleteSelected() {
    if (this._selected) this._deleteObject(this._selected);
  },

  _clearAll() {
    this._placed.forEach(function(p) { if (p.mesh) this._scene.remove(p.mesh); }.bind(this));
    this._placed = [];
    this._deselectAll();
  },

  // ---------- Save ----------

  _save() {
    var mapId = 'map_custom_' + Date.now().toString(36);
    var mapName = prompt('Harita adi:', 'Custom Map') || 'Custom Map';
    var desc = prompt('Harita aciklamasi:', 'Custom created map') || 'Custom created map';

    var used = {};
    var pluginIds = [];
    this._placed.forEach(function(p) {
      if (!used[p.pluginId]) { used[p.pluginId] = true; pluginIds.push(p.pluginId); }
    });

    var code = this._genCode(mapId, mapName, desc, pluginIds);
    var blob = new Blob([code], { type: 'application/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = mapId + '.js';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
    this._setTip('Kaydedildi: ' + mapId + '.js');
  },

  _genCode(mapId, mapName, desc, pluginIds) {
    var indent = '  ';
    var nl = '\n';
    var j = JSON.stringify;

    // Sorted: skybox/ground first, sun/moon last, rest alphabetical
    var order = pluginIds.slice().sort(function(a, b) {
      var aIsFirst = a.indexOf('skybox') !== -1 || a.indexOf('ground') !== -1;
      var bIsFirst = b.indexOf('skybox') !== -1 || b.indexOf('ground') !== -1;
      if (aIsFirst && !bIsFirst) return -1;
      if (!aIsFirst && bIsFirst) return 1;
      var aIsLast = a.indexOf('sun') !== -1 || a.indexOf('moon') !== -1;
      var bIsLast = b.indexOf('sun') !== -1 || b.indexOf('moon') !== -1;
      if (aIsLast && !bIsLast) return 1;
      if (!aIsLast && bIsLast) return -1;
      return a < b ? -1 : 1;
    });

    var c = '';
    c += 'var plugin = include(\'registry\');' + nl;
    c += 'var loader = include(\'loader\');' + nl + nl;
    c += 'plugin.register({' + nl;
    c += indent + 'id: \'' + mapId + '\',' + nl;
    c += indent + 'name: \'' + mapName + '\',' + nl;
    c += indent + 'version: \'1.0\',' + nl;
    c += indent + 'type: \'scene\',' + nl;
    c += indent + 'description: \'' + desc + '\',' + nl + nl;
    c += indent + 'game: null,' + nl + indent + 'objects: [],' + nl + indent + 'colliders: [],' + nl;
    c += indent + '_ready: false,' + nl + indent + '_depCount: 0,' + nl + indent + '_depLoaded: 0,' + nl;
    c += indent + '_modelPaths: ' + j(order) + ',' + nl + nl;
    c += indent + 'init(game) {' + nl;
    c += indent + indent + 'this.game = game;' + nl + indent + indent + 'this.objects = [];' + nl + indent + indent + 'this.colliders = [];' + nl;
    c += indent + indent + 'this._ready = false;' + nl + indent + indent + 'this._depCount = 0;' + nl + indent + indent + 'this._depLoaded = 0;' + nl;
    c += indent + indent + 'var self = this;' + nl;
    c += indent + indent + 'this._depCount = this._modelPaths.length;' + nl + indent + indent + 'this._depLoaded = 0;' + nl;
    c += indent + indent + 'this._modelPaths.forEach(function(path) {' + nl;
    c += indent + indent + indent + 'loader.loadScript(path, function(err) {' + nl;
    c += indent + indent + indent + indent + 'if (err) console.warn(\'[' + mapId + ']\', err);' + nl;
    c += indent + indent + indent + indent + 'self._depLoaded++;' + nl + indent + indent + indent + '});' + nl + indent + indent + '});' + nl;
    c += indent + indent + 'if (!game.currentMap || game.currentMap.id !== \'' + mapId + '\') return;' + nl + indent + '},' + nl + nl;
    c += indent + 'update(dt) {' + nl;
    c += indent + indent + 'if (this._ready) return;' + nl + indent + indent + 'if (this._depLoaded < this._depCount) return;' + nl;
    c += indent + indent + 'if (!this.game || !this.game.currentMap || this.game.currentMap.id !== \'' + mapId + '\') return;' + nl;
    c += indent + indent + 'this._ready = true;' + nl + indent + indent + 'this._buildMap();' + nl + indent + '},' + nl + nl;
    c += indent + '_buildMap: function() {' + nl;
    c += indent + indent + 'var scene = this.game.scene;' + nl + indent + indent + 'var self = this;' + nl + nl;
    c += indent + indent + 'function addModel(pluginId, config) {' + nl;
    c += indent + indent + indent + 'var p = plugin.get(pluginId);' + nl;
    c += indent + indent + indent + 'if (!p || !p.enabled || typeof p.createModel !== \'function\') {' + nl;
    c += indent + indent + indent + indent + 'if (!p) console.warn(\'[' + mapId + ']\', \'Model bulunamadi:\', pluginId);' + nl;
    c += indent + indent + indent + indent + 'return;' + nl + indent + indent + indent + '}' + nl;
    c += indent + indent + indent + 'try {' + nl;
    c += indent + indent + indent + indent + 'var result = p.createModel(config);' + nl;
    c += indent + indent + indent + indent + 'if (result && result.mesh) {' + nl;
    c += indent + indent + indent + indent + indent + 'scene.add(result.mesh);' + nl + indent + indent + indent + indent + indent + 'self.objects.push(result.mesh);' + nl;
    c += indent + indent + indent + indent + indent + 'if (result.colliders) {' + nl;
    c += indent + indent + indent + indent + indent + indent + 'result.colliders.forEach(function(c) { self.colliders.push(c); });' + nl;
    c += indent + indent + indent + indent + indent + '}' + nl + indent + indent + indent + indent + '}' + nl;
    c += indent + indent + indent + '} catch (e) {' + nl;
    c += indent + indent + indent + indent + 'console.warn(\'[' + mapId + ']\', \'Yukleme hatasi:\', pluginId, e);' + nl;
    c += indent + indent + indent + '}' + nl + indent + indent + '}' + nl + nl;

    this._placed.forEach(function(p) {
      c += indent + indent + 'addModel(\'' + p.pluginId + '\', ' + j(p.config) + ');' + nl;
    });
    c += indent + '},' + nl + nl;
    c += indent + 'getMapConfig: function() {' + nl;
    c += indent + indent + 'return {' + nl;
    c += indent + indent + indent + 'id: \'' + mapId + '\',' + nl;
    c += indent + indent + indent + 'name: \'' + mapName + '\',' + nl;
    c += indent + indent + indent + 'mode: \'normal\',' + nl;
    c += indent + indent + indent + 'modeDescription: \'' + desc + '\',' + nl;
    c += indent + indent + indent + 'playerSpawn: [0, 0.5, 0],' + nl;
    c += indent + indent + indent + 'zombieSpawns: [[8,0,8],[-8,0,-8],[8,0,-8],[-8,0,8],[12,0,0],[-12,0,0],[0,0,12],[0,0,-12]],' + nl;
    c += indent + indent + indent + 'thumbnailCamera: { position: [0, 22, 22], target: [0, 0, 0] },' + nl;
    c += indent + indent + indent + 'dropbox: { zones: [{ center: [0, 0, 0], radius: 6 }], dropInterval: 45, fallSpeed: 2.5, minHeight: 16 }' + nl;
    c += indent + indent + '};' + nl + indent + '},' + nl + nl;
    c += indent + 'getIntroData: function() {' + nl;
    c += indent + indent + 'return { cameraPath: [' + nl;
    c += indent + indent + indent + '{ pos: [0, 0.6, 10], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 },' + nl;
    c += indent + indent + indent + '{ pos: [10, 0.6, 5], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 }' + nl;
    c += indent + indent + indent + '] };' + nl + indent + '},' + nl + nl;
    c += indent + 'buildThumbnail: function(targetScene, callback) {' + nl;
    c += indent + indent + 'function addModel(pluginId, config) {' + nl;
    c += indent + indent + indent + 'var p = plugin.get(pluginId);' + nl;
    c += indent + indent + indent + 'if (!p || !p.enabled || typeof p.createModel !== \'function\') return;' + nl;
    c += indent + indent + indent + 'try {' + nl;
    c += indent + indent + indent + indent + 'var result = p.createModel(config);' + nl;
    c += indent + indent + indent + indent + 'if (result && result.mesh) targetScene.add(result.mesh);' + nl;
    c += indent + indent + indent + '} catch (e) {}' + nl + indent + indent + '}' + nl + nl;
    this._placed.forEach(function(p) {
      c += indent + indent + 'addModel(\'' + p.pluginId + '\', ' + j(p.config) + ');' + nl;
    });
    c += indent + indent + 'callback();' + nl + indent + '},' + nl + nl;
    c += indent + 'getColliders: function() { return this.colliders; },' + nl + nl;
    c += indent + 'destroy() {' + nl;
    c += indent + indent + 'var scene = this.game ? this.game.scene : null;' + nl + indent + indent + 'if (!scene) return;' + nl;
    c += indent + indent + 'this.objects.forEach(function(obj) { scene.remove(obj); });' + nl;
    c += indent + indent + 'this.objects = [];' + nl + indent + indent + 'this.colliders = [];' + nl + indent + '}' + nl;
    c += '});' + nl;
    return c;
  },

  destroy() {
    this.close();
    plugin.off('menu:map_creator', this.id);
  }
});
