var plugin = include('registry');
var loader = include('loader');
var cvar = include('cvar');

plugin.register({
  id: 'map_night',
  name: 'Gece Tapınağı',
  version: '1.0',
  type: 'scene',
  description: 'Gece haritasi — ay isigi, fenerler, mezarlar, gargoyleler',

  game: null,
  objects: [],
  colliders: [],
  _ready: false,
  _depCount: 0,
  _depLoaded: 0,
  _modelPaths: [
    'map_night_ground',
    'map_moon',
    'map_night_statue',
    'map_night_crypt',
    'map_night_brazier',
    'map_night_lantern_post',
    'map_night_tree',
    'map_wall',
    'map_skybox_night'
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
        if (err) console.warn('[map_night]', err);
        self._depLoaded++;
      });
    });

    if (!game.currentMap || game.currentMap.id !== 'night') return;
  },

  update(dt) {
    if (this._ready) return;
    if (this._depLoaded < this._depCount) return;
    if (!this.game || !this.game.currentMap || this.game.currentMap.id !== 'night') return;
    this._ready = true;
    this._buildMap();
  },

  _buildMap: function() {
    var scene = this.game.scene;
    var self = this;

    function addModel(pluginId, config) {
      var p = plugin.get(pluginId);
      if (!p || !p.enabled || typeof p.createModel !== 'function') {
        if (!p) console.warn('[map_night] model bulunamadi:', pluginId);
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
        console.warn('[map_night] model yukleme hatasi:', pluginId, e);
      }
    }

    addModel('map_night_ground', { size: 60 });
    addModel('map_skybox_night', {});
    addModel('map_moon', { position: [12, 24, 8], targetX: 0, targetZ: 0, intensity: 0.8, ambientIntensity: 0.15, hemiIntensity: 0.2, shadowSize: 35 });

    cvar.set('gfx_fog_density', 0.012);

    // 4 gargoyle — kose noktalarinda
    var statuePositions = [[-12, -12], [12, -12], [-12, 12], [12, 12]];
    statuePositions.forEach(function(pos, idx) {
      addModel('map_night_statue', {
        position: [pos[0], 0, pos[1]], rotationY: idx * Math.PI / 2, scale: 1.0
      });
    });

    // 8 mezar — iki sira halinde
    for (var i = -3; i <= 3; i++) {
      if (i === 0) continue;
      addModel('map_night_crypt', { position: [i * 2.5, 0, -10], rotationY: 0 });
      addModel('map_night_crypt', { position: [i * 2.5, 0, 10], rotationY: Math.PI });
    }

    // 4 büyük ates ocagi — ic kosede
    var brazierPos = [[-16, -16], [16, -16], [-16, 16], [16, 16]];
    brazierPos.forEach(function(pos) {
      addModel('map_night_brazier', { position: [pos[0], 0, pos[1]] });
    });

    // 8 fener diregi — yol boyunca
    for (var a = 0; a < 8; a++) {
      var ag = a * Math.PI / 4;
      addModel('map_night_lantern_post', {
        position: [Math.sin(ag) * 14, 0, Math.cos(ag) * 14]
      });
    }

    // 6 kuru agac — rastgele dagilmis
    var treePos = [[-18, -5], [18, -5], [-5, -18], [5, 18], [-20, 10], [20, 10]];
    treePos.forEach(function(pos, idx) {
      addModel('map_night_tree', {
        position: [pos[0], 0, pos[1]], scale: 0.8 + idx * 0.1
      });
    });

    var H = 28;
    addModel('map_wall', { position: [0, 0, -H], sizeX: 56, sizeZ: 0.4, height: 1.5, color: 0x3a3a4a });
    addModel('map_wall', { position: [0, 0, H], sizeX: 56, sizeZ: 0.4, height: 1.5, color: 0x3a3a4a });
    addModel('map_wall', { position: [-H, 0, 0], sizeX: 0.4, sizeZ: 56, height: 1.5, color: 0x3a3a4a });
    addModel('map_wall', { position: [H, 0, 0], sizeX: 0.4, sizeZ: 56, height: 1.5, color: 0x3a3a4a });

    var w = plugin.get('fx_weather');
    if (w && w.setWeather) w.setWeather({ rain: 0.4, fog: 0.6, wind: 0.2 });
  },

  getMapConfig: function() {
    return {
      id: 'night',
      name: 'Gece Tapınağı',
      mode: 'normal',
      modeDescription: 'Her dalgada artan zorluk — gece',
      playerSpawn: [0, 0.5, 0],
      zombieSpawns: [
        [6, 0, 6], [-6, 0, -6], [6, 0, -6], [-6, 0, 6],
        [10, 0, 0], [-10, 0, 0], [0, 0, 10], [0, 0, -10],
        [14, 0, 14], [-14, 0, -14]
      ],
      thumbnailCamera: {
        position: [0, 22, 22],
        target: [0, 0, 0]
      },
      dropbox: {
        zones: [{ center: [0, 0, 0], radius: 7 }],
        dropInterval: 40,
        fallSpeed: 2.5,
        minHeight: 16
      }
    };
  },

  getIntroData: function() {
    return {
      cameraPath: [
        { pos: [0, 0.6, 12], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 },
        { pos: [14, 0.6, 6], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 },
        { pos: [-12, 0.6, -8], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 }
      ]
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
      } catch (e) { console.warn('[buildThumbnail]', pluginId, e.message); }
    }

    function build() {
      addModel('map_skybox_night', {});
      addModel('map_moon', { position: [12, 24, 8], targetX: 0, targetZ: 0, intensity: 0.8, ambientIntensity: 0.15, hemiIntensity: 0.2, castShadow: false });
      addModel('map_night_ground', { size: 60 });
      var statuePositions = [[-12, -12], [12, -12], [-12, 12], [12, 12]];
      statuePositions.forEach(function(pos, idx) {
        addModel('map_night_statue', { position: [pos[0], 0, pos[1]], rotationY: idx * Math.PI / 2 });
      });
      for (var i = -3; i <= 3; i++) {
        if (i === 0) continue;
        addModel('map_night_crypt', { position: [i * 2.5, 0, -10] });
        addModel('map_night_crypt', { position: [i * 2.5, 0, 10], rotationY: Math.PI });
      }
      var brazierPos = [[-16, -16], [16, -16], [-16, 16], [16, 16]];
      brazierPos.forEach(function(pos) {
        addModel('map_night_brazier', { position: [pos[0], 0, pos[1]] });
      });
      for (var a = 0; a < 8; a++) {
        var ag = a * Math.PI / 4;
        addModel('map_night_lantern_post', { position: [Math.sin(ag) * 14, 0, Math.cos(ag) * 14] });
      }
      var treePos = [[-18, -5], [18, -5], [-5, -18], [5, 18], [-20, 10], [20, 10]];
      treePos.forEach(function(pos, idx) {
        addModel('map_night_tree', { position: [pos[0], 0, pos[1]], scale: 0.8 + idx * 0.1 });
      });
      var H = 28;
      addModel('map_wall', { position: [0, 0, -H], sizeX: 56, sizeZ: 0.4, height: 1.5, color: 0x3a3a4a });
      addModel('map_wall', { position: [0, 0, H], sizeX: 56, sizeZ: 0.4, height: 1.5, color: 0x3a3a4a });
      addModel('map_wall', { position: [-H, 0, 0], sizeX: 0.4, sizeZ: 56, height: 1.5, color: 0x3a3a4a });
      addModel('map_wall', { position: [H, 0, 0], sizeX: 0.4, sizeZ: 56, height: 1.5, color: 0x3a3a4a });
      callback();
    }

    build();
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
