var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'map_polygon',
  name: 'Advanced Polygon Arena',
  version: '2.0',
  type: 'scene',
  description: 'Open-top tactical arena with towers, pits and cover',
  game: null,
  objects: [],
  colliders: [],
  _ready: false,
  _depCount: 0,
  _depLoaded: 0,
  _modelPaths: [
    'map_ground_advanced',
    'map_platform_tower',
    'map_cover_wall',
    'map_pit_center',
    'map_spawn_platforms',
    'map_sun',
    'map_skybox_day'
  ],

  init: function(game) {
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
        if (err) console.warn('[map_polygon]', err);
        self._depLoaded++;
      });
    });
  },

  update: function(dt) {
    if (this._ready) return;
    if (this._depLoaded < this._depCount) return;
    if (!this.game || !this.game.currentMap || this.game.currentMap.id !== 'polygon') return;
    this._ready = true;
    this._buildMap();
  },

  _buildMap: function() {
    var scene = this.game.scene;
    var self = this;
    var RX = 24, RZ = 18, WH = 3;

    function addModel(pluginId, config) {
      var p = plugin.get(pluginId);
      if (!p || !p.enabled || typeof p.createModel !== 'function') {
        if (!p) console.warn('[map_polygon] model bulunamadi:', pluginId);
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
        console.warn('[map_polygon] model yukleme hatasi:', pluginId, e);
      }
    }

    addModel('map_skybox_day', {});
    addModel('map_sun', {
      position: [20, 35, 15], targetX: 0, targetZ: 0, intensity: 1.8
    });

    addModel('map_ground_advanced', { sizeX: RX * 2, sizeZ: RZ * 2 });

    addModel('map_platform_tower', {
      position: [0, 0, 0], sizeX: 5, sizeZ: 5, height: 4
    });

    addModel('map_cover_wall', {
      position: [0, 0, -RZ], sizeX: RX * 2, height: WH, color: 0x888888
    });
    addModel('map_cover_wall', {
      position: [0, 0, RZ], sizeX: RX * 2, height: WH, color: 0x555555
    });
    addModel('map_cover_wall', {
      position: [-RX, 0, 0], sizeX: 0.2, sizeZ: RZ * 2, height: WH, color: 0x777777
    });
    addModel('map_cover_wall', {
      position: [RX, 0, 0], sizeX: 0.2, sizeZ: RZ * 2, height: WH, color: 0x777777
    });

    addModel('map_cover_wall', {
      type: 'tactical_shelter', position: [-6, 0, -5], sizeZ: 0.3, height: WH
    });

    addModel('map_pit_center', { position: [0, 0, 0], radius: 3, depth: 4 });

    var spawns = [[-8, -6], [8, -6], [-8, 6], [8, 6]];
    spawns.forEach(function(s) {
      addModel('map_spawn_platforms', { position: [s[0], 0, s[1]] });
    });
  },

  getMapConfig: function() {
    return {
      id: 'polygon',
      name: 'Advanced Polygon Arena',
      mode: 'polygon',
      modeDescription: 'Open-top tactical arena with towers, pits and cover',
      playerSpawn: [0, 0.5, -12],
      zombieSpawns: [
        [0, 0, 5], [-9, 0, 0], [9, 0, 0],
        [-9, 0, 9], [9, 0, 9],
        [-5, 0, -4], [5, 0, -4],
        [-12, 0, 0], [12, 0, 0],
        [0, 0, -8]
      ],
      thumbnailCamera: {
        position: [0, 15, 22],
        target: [0, 1, 0]
      },
      dropbox: {
        zones: [{ center: [0, 0, 0], radius: 4 }],
        dropInterval: 45,
        fallSpeed: 3,
        minHeight: 12
      }
    };
  },

  getIntroData: function() {
    return {
      cameraPath: [
        { pos: [0, 1.5, 14], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 },
        { pos: [-10, 1.5, 8], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 },
        { pos: [10, 1.5, -6], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 }
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
      } catch (e) {}
    }
    function build() {
      addModel('map_skybox_day', {});
      addModel('map_sun', {
        position: [20, 35, 15], targetX: 0, targetZ: 0, intensity: 1.8, castShadow: false
      });

      var RX = 24, RZ = 18, WH = 3;
      addModel('map_ground_advanced', { sizeX: RX * 2, sizeZ: RZ * 2 });
      addModel('map_platform_tower', { position: [0, 0, 0], sizeX: 5, sizeZ: 5, height: 4 });
      addModel('map_cover_wall', { position: [0, 0, -RZ], sizeX: RX * 2, height: WH, color: 0x888888 });
      addModel('map_cover_wall', { position: [0, 0, RZ], sizeX: RX * 2, height: WH, color: 0x555555 });
      addModel('map_cover_wall', { position: [-RX, 0, 0], sizeX: 0.2, sizeZ: RZ * 2, height: WH, color: 0x777777 });
      addModel('map_cover_wall', { position: [RX, 0, 0], sizeX: 0.2, sizeZ: RZ * 2, height: WH, color: 0x777777 });
      callback();
    }
    if (this._ready) {
      build();
    } else if (this._depLoaded >= this._depCount) {
      build();
    } else {
      (function check() {
        if (self._depLoaded >= self._depCount) {
          build();
        } else {
          setTimeout(check, 100);
        }
      })();
    }
  },

  getColliders: function() {
    return this.colliders;
  },

  destroy: function() {
    var scene = this.game ? this.game.scene : null;
    if (!scene) return;
    this.objects.forEach(function(obj) {
      scene.remove(obj);
    });
    this.objects = [];
    this.colliders = [];
  }
});