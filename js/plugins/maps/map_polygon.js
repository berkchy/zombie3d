var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'map_polygon',
  name: 'Poligon',
  version: '1.0',
  type: 'scene',
  description: 'Kapali poligon atis sahasi',
  game: null,
  objects: [],
  colliders: [],
  _ready: false,
  _depCount: 0,
  _depLoaded: 0,
  _modelPaths: [
    'map_pg_floor',
    'map_pg_wall',
    'map_pg_ceiling',
    'map_pg_light'
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

    if (!game.currentMap || game.currentMap.id !== 'polygon') return;

    var amb = new THREE.AmbientLight(0x404060, 0.25);
    game.scene.add(amb);
    this.objects.push(amb);
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
    var RX = 18, RZ = 12, RH = 7;

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

    addModel('map_pg_floor', { sizeX: RX * 2, sizeZ: RZ * 2, color: 0x4a4a4a });
    addModel('map_pg_ceiling', { sizeX: RX * 2, sizeZ: RZ * 2, y: RH });

    addModel('map_pg_wall', { position: [0, 0, -RZ], sizeX: RX * 2, height: RH, color: 0x888888 });
    addModel('map_pg_wall', { position: [0, 0, RZ], sizeX: RX * 2, height: RH, color: 0x555555 });
    addModel('map_pg_wall', { position: [-RX, 0, 0], sizeX: 0.2, sizeZ: RZ * 2, height: RH, color: 0x777777 });
    addModel('map_pg_wall', { position: [RX, 0, 0], sizeX: 0.2, sizeZ: RZ * 2, height: RH, color: 0x777777 });

    var lightPositions = [
      [-9, RH, -6], [0, RH, -6], [9, RH, -6],
      [-9, RH, 6], [0, RH, 6], [9, RH, 6]
    ];
    lightPositions.forEach(function(lp) {
      addModel('map_pg_light', { position: lp });
      var pl = new THREE.PointLight(0xffdd88, 0.9, 14);
      pl.position.set(lp[0], lp[1] - 0.3, lp[2]);
      scene.add(pl);
      self.objects.push(pl);
    });
  },

  getMapConfig: function() {
    return {
      id: 'polygon',
      name: 'Poligon',
      mode: 'polygon',
      modeDescription: 'Sinirsiz cephane, hedef tatbikati',
      playerSpawn: [0, 0.5, -9],
      zombieSpawns: [
        [0, 0, 3], [-7, 0, 0], [7, 0, 0],
        [-7, 0, 7], [7, 0, 7],
        [-4, 0, -3], [4, 0, -3],
        [-10, 0, 0], [10, 0, 0],
        [0, 0, -6]
      ],
      thumbnailCamera: {
        position: [0, 12, 16],
        target: [0, 2, 0]
      }
    };
  },

  getIntroData: function() {
    return {
      cameraPath: [
        { pos: [0, 12, 16], target: [0, 2, 0], duration: 3.5 },
        { pos: [-16, 5, 0], target: [0, 2, 0], duration: 3 },
        { pos: [16, 5, 0], target: [0, 2, 0], duration: 3 },
        { pos: [0, 8, -14], target: [0, 2, 0], duration: 3 },
        { pos: [0, 7, 14], target: [0, 1, 0], duration: 2.5 }
      ],
      aboveHeight: 4
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
      var amb = new THREE.AmbientLight(0x404060, 0.25);
      targetScene.add(amb);
      var RX = 18, RZ = 12, RH = 7;
      addModel('map_pg_floor', { sizeX: RX * 2, sizeZ: RZ * 2, color: 0x4a4a4a });
      addModel('map_pg_ceiling', { sizeX: RX * 2, sizeZ: RZ * 2, y: RH });
      addModel('map_pg_wall', { position: [0, 0, -RZ], sizeX: RX * 2, height: RH, color: 0x888888 });
      addModel('map_pg_wall', { position: [0, 0, RZ], sizeX: RX * 2, height: RH, color: 0x555555 });
      addModel('map_pg_wall', { position: [-RX, 0, 0], sizeX: 0.2, sizeZ: RZ * 2, height: RH, color: 0x777777 });
      addModel('map_pg_wall', { position: [RX, 0, 0], sizeX: 0.2, sizeZ: RZ * 2, height: RH, color: 0x777777 });
      var lightPositions = [
        [-9, RH, -6], [0, RH, -6], [9, RH, -6],
        [-9, RH, 6], [0, RH, 6], [9, RH, 6]
      ];
      lightPositions.forEach(function(lp) {
        addModel('map_pg_light', { position: lp });
        var pl = new THREE.PointLight(0xffdd88, 0.9, 14);
        pl.position.set(lp[0], lp[1] - 0.3, lp[2]);
        targetScene.add(pl);
      });
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
