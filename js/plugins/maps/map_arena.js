var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'map_arena',
  name: 'Antik Kalıntılar',
  version: '2.1',
  type: 'scene',
  description: 'Antik harabe arenası — plugin tabanli harita objeleri',

  game: null,
  objects: [],
  colliders: [],
  _ready: false,
  _depCount: 0,
  _depLoaded: 0,
  _modelPaths: [
    'map_ground',
    'map_platform',
    'map_pillar',
    'map_ruins',
    'map_torch',
    'map_wall'
  ],

  init(game) {
    this.game = game;
    this.objects = [];
    this.colliders = [];
    this._ready = false;
    this._depCount = 0;
    this._depLoaded = 0;

    var self = this;
    this._depCount = this._modelPaths.length;
    this._depLoaded = 0;

    this._modelPaths.forEach(function(path) {
      loader.loadScript(path, function(err) {
        if (err) console.warn('[map_arena]', err);
        self._depLoaded++;
      });
    });

    if (!game.currentMap || game.currentMap.id !== 'arena') return;

    this.arenaSize = 60;
  },

  update(dt) {
    if (this._ready) return;
    if (this._depLoaded < this._depCount) return;
    if (!this.game || !this.game.currentMap || this.game.currentMap.id !== 'arena') return;
    this._ready = true;
    this._buildMap();
  },

  _buildMap: function() {
    var scene = this.game.scene;
    var self = this;

    var amb = new THREE.AmbientLight(0x605060, 0.45);
    scene.add(amb);
    this.objects.push(amb);

    var sun = new THREE.DirectionalLight(0xffaa66, 1.3);
    sun.position.set(10, 25, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    var d = 35;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.camera.far = 50;
    scene.add(sun);
    this.objects.push(sun);

    function addModel(pluginId, config) {
      var p = plugin.get(pluginId);
      if (!p || !p.enabled || typeof p.createModel !== 'function') {
        if (!p) console.warn('[map_arena] model bulunamadi:', pluginId);
        return;
      }
      try {
        var result = p.createModel(config);
        if (result && result.mesh) {
          scene.add(result.mesh);
          self.objects.push(result.mesh);
          if (result.colliders) {
            result.colliders.forEach(function(c) { self.colliders.push(c); });
          }
        }
      } catch (e) {
        console.warn('[map_arena] model yukleme hatasi:', pluginId, e);
      }
    }

    addModel('map_ground', { size: 60, color: 0x9a8a6a });
    addModel('map_platform', { position: [0, 0, 0] });
    for (var i = 0; i < 8; i++) {
      var ag = i * Math.PI / 4 + Math.PI / 8;
      addModel('map_pillar', {
        position: [Math.sin(ag) * 11, 0, Math.cos(ag) * 11],
        height: 3.0, radius: 0.45, fallen: false
      });
    }
    addModel('map_pillar', {
      position: [-14, 0, -14], fallen: true, length: 2.5,
      rotX: Math.PI / 2.5, rotZ: 0.3, radius: 0.4
    });
    addModel('map_pillar', {
      position: [14, 0, 14], fallen: true, length: 2.0,
      rotX: Math.PI / 3, rotZ: -0.4, radius: 0.4
    });
    var ruins = [
      { x: -8, z: -18, sx: 2.5, sz: 0.4, h: 1.2 },
      { x: 8, z: -18, sx: 2.5, sz: 0.4, h: 0.8 },
      { x: -18, z: -8, sx: 0.4, sz: 2.5, h: 1.0 },
      { x: -18, z: 8, sx: 0.4, sz: 2.5, h: 0.6 },
      { x: 18, z: -8, sx: 0.4, sz: 2.5, h: 1.1 },
      { x: 18, z: 8, sx: 0.4, sz: 2.5, h: 0.7 },
      { x: -8, z: 18, sx: 2.5, sz: 0.4, h: 0.9 },
      { x: 8, z: 18, sx: 2.5, sz: 0.4, h: 1.3 }
    ];
    ruins.forEach(function(r) {
      addModel('map_ruins', {
        position: [r.x, 0, r.z], sizeX: r.sx, sizeZ: r.sz, height: r.h
      });
    });
    var torches = [[-14, -14], [14, -14], [-14, 14], [14, 14]];
    torches.forEach(function(pos) {
      addModel('map_torch', { position: [pos[0], 0, pos[1]] });
    });
    var H = 30;
    addModel('map_wall', { position: [0, 0, -H], sizeX: 60, sizeZ: 0.4, height: 1.5 });
    addModel('map_wall', { position: [0, 0, H], sizeX: 60, sizeZ: 0.4, height: 1.5 });
    addModel('map_wall', { position: [-H, 0, 0], sizeX: 0.4, sizeZ: 60, height: 1.5 });
    addModel('map_wall', { position: [H, 0, 0], sizeX: 0.4, sizeZ: 60, height: 1.5 });
  },

  getMapConfig: function() {
    return {
      id: 'arena',
      name: 'Antik Kalıntılar',
      mode: 'normal',
      modeDescription: 'Her dalgada artan zorluk',
      playerSpawn: [0, 0.5, 0],
      zombieSpawns: [
        [8, 0, 8], [-8, 0, -8],
        [8, 0, -8], [-8, 0, 8],
        [12, 0, 0], [-12, 0, 0],
        [0, 0, 12], [0, 0, -12]
      ],
      thumbnailCamera: {
        position: [0, 22, 22],
        target: [0, 0, 0]
      }
    };
  },

  getIntroData: function() {
    return {
      cameraPath: [
        { pos: [0, 22, 28], target: [0, 0, 0], duration: 4 },
        { pos: [24, 10, 10], target: [11, 0, 11], duration: 3.5 },
        { pos: [18, 7, -18], target: [-14, 0, -14], duration: 3.5 },
        { pos: [-20, 9, -14], target: [-8, 0, 18], duration: 3.5 },
        { pos: [-14, 14, 22], target: [8, 0, -8], duration: 3 }
      ],
      aboveHeight: 5
    };
  },

  buildThumbnail: function(targetScene, callback) {
    var self = this;

    function addModel(pluginId, config) {
      var p = plugin.get(pluginId);
      if (!p || !p.enabled || typeof p.createModel !== 'function') return;
      try {
        var result = p.createModel(config);
        if (result && result.mesh) targetScene.add(result.mesh);
      } catch (e) {}
    }

    function build() {
      var amb = new THREE.AmbientLight(0x605060, 0.45);
      targetScene.add(amb);
      var sun = new THREE.DirectionalLight(0xffaa66, 1.3);
      sun.position.set(10, 25, 10);
      targetScene.add(sun);

      addModel('map_ground', { size: 60, color: 0x9a8a6a });
      addModel('map_platform', { position: [0, 0, 0] });
      for (var i = 0; i < 8; i++) {
        var ag = i * Math.PI / 4 + Math.PI / 8;
        addModel('map_pillar', {
          position: [Math.sin(ag) * 11, 0, Math.cos(ag) * 11],
          height: 3.0, radius: 0.45, fallen: false
        });
      }
      addModel('map_pillar', {
        position: [-14, 0, -14], fallen: true, length: 2.5,
        rotX: Math.PI / 2.5, rotZ: 0.3, radius: 0.4
      });
      addModel('map_pillar', {
        position: [14, 0, 14], fallen: true, length: 2.0,
        rotX: Math.PI / 3, rotZ: -0.4, radius: 0.4
      });
      var ruins = [
        { x: -8, z: -18, sx: 2.5, sz: 0.4, h: 1.2 },
        { x: 8, z: -18, sx: 2.5, sz: 0.4, h: 0.8 },
        { x: -18, z: -8, sx: 0.4, sz: 2.5, h: 1.0 },
        { x: -18, z: 8, sx: 0.4, sz: 2.5, h: 0.6 },
        { x: 18, z: -8, sx: 0.4, sz: 2.5, h: 1.1 },
        { x: 18, z: 8, sx: 0.4, sz: 2.5, h: 0.7 },
        { x: -8, z: 18, sx: 2.5, sz: 0.4, h: 0.9 },
        { x: 8, z: 18, sx: 2.5, sz: 0.4, h: 1.3 }
      ];
      ruins.forEach(function(r) {
        addModel('map_ruins', {
          position: [r.x, 0, r.z], sizeX: r.sx, sizeZ: r.sz, height: r.h
        });
      });
      var torches = [[-14, -14], [14, -14], [-14, 14], [14, 14]];
      torches.forEach(function(pos) {
        addModel('map_torch', { position: [pos[0], 0, pos[1]] });
      });
      var H = 30;
      addModel('map_wall', { position: [0, 0, -H], sizeX: 60, sizeZ: 0.4, height: 1.5 });
      addModel('map_wall', { position: [0, 0, H], sizeX: 60, sizeZ: 0.4, height: 1.5 });
      addModel('map_wall', { position: [-H, 0, 0], sizeX: 0.4, sizeZ: 60, height: 1.5 });
      addModel('map_wall', { position: [H, 0, 0], sizeX: 0.4, sizeZ: 60, height: 1.5 });
      callback();
    }

    if (this._ready) {
      build();
    } else if (this._depLoaded >= this._depCount) {
      build();
    } else {
      var check = function() {
        if (self._depLoaded >= self._depCount) {
          build();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    }
  },

  getColliders: function() {
    return this.colliders;
  },

  destroy() {
    var scene = this.game ? this.game.scene : null;
    if (!scene) return;
    this.objects.forEach(function(obj) {
      scene.remove(obj);
    });
    this.objects = [];
    this.colliders = [];
  }
});
