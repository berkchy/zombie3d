var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'map_empty',
  name: 'Boş Oda',
  version: '1.0',
  type: 'scene',
  description: 'Sadece zemin ve duvarlar — hiçbir obje yok, zombi yok',

  game: null,
  objects: [],
  colliders: [],
  _ready: false,
  _depCount: 0,
  _depLoaded: 0,
  _modelPaths: ['map_sun', 'map_skybox_day'],

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
        if (err) console.warn('[map_empty]', err);
        self._depLoaded++;
      });
    });
  },

  update(dt) {
    if (this._ready) return;
    if (this._depLoaded < this._depCount) return;
    if (!this.game || !this.game.currentMap || this.game.currentMap.id !== 'empty') return;
    this._ready = true;
    this._buildMap();
  },

  _buildMap() {
    var scene = this.game.scene;
    var self = this;

    function addModel(pluginId, config) {
      var p = plugin.get(pluginId);
      if (!p || !p.enabled || typeof p.createModel !== 'function') {
        if (!p) console.warn('[map_empty] model bulunamadi:', pluginId);
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
        console.warn('[map_empty] model yukleme hatasi:', pluginId, e);
      }
    }

    addModel('map_skybox_day', {});
    addModel('map_sun', { position: [10, 20, 15], targetX: 0, targetZ: 0, intensity: 1.2, ambientIntensity: 0.45, hemiIntensity: 0.35, shadowSize: 25 });

    var size = 30;
    var floorMat = new THREE.MeshStandardMaterial({ color: 0x6a7a7a, roughness: 0.7 });
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x8a9a9a, roughness: 0.6 });
    var self = this;

    var floor = new THREE.Mesh(new THREE.BoxGeometry(size, 0.3, size), floorMat);
    floor.position.set(0, -0.15, 0);
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);
    this.objects.push(floor);
    this.colliders.push({
      min: [-size / 2, 0, -size / 2],
      max: [size / 2, 0, size / 2],
      walkable: true
    });

    var wallH = 3;
    var wallT = 0.3;

    var walls = [
      { pos: [0, wallH / 2, -size / 2], scale: [size, wallH, wallT] },
      { pos: [0, wallH / 2, size / 2], scale: [size, wallH, wallT] },
      { pos: [-size / 2, wallH / 2, 0], scale: [wallT, wallH, size] },
      { pos: [size / 2, wallH / 2, 0], scale: [wallT, wallH, size] }
    ];

    walls.forEach(function(w) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w.scale[0], w.scale[1], w.scale[2]), wallMat);
      m.position.set(w.pos[0], w.pos[1], w.pos[2]);
      m.receiveShadow = true;
      m.castShadow = true;
      m.name = 'wall';
      scene.add(m);
      self.objects.push(m);
    });

    this.colliders.push({
      min: [-size / 2, 0, -size / 2 - wallT],
      max: [size / 2, wallH, -size / 2],
      walkable: false
    });
    this.colliders.push({
      min: [-size / 2, 0, size / 2],
      max: [size / 2, wallH, size / 2 + wallT],
      walkable: false
    });
    this.colliders.push({
      min: [-size / 2 - wallT, 0, -size / 2],
      max: [-size / 2, wallH, size / 2],
      walkable: false
    });
    this.colliders.push({
      min: [size / 2, 0, -size / 2],
      max: [size / 2 + wallT, wallH, size / 2],
      walkable: false
    });
  },

  getMapConfig() {
    return {
      id: 'empty',
      name: 'Boş Oda',
      mode: 'empty',
      modeDescription: 'Sadece zemin ve duvarlar — zombi yok',
      playerSpawn: [0, 0.5, 0],
      zombieSpawns: [],
      thumbnailCamera: {
        position: [0, 8, 14],
        target: [0, 0, 0]
      },
      dropbox: {
        zones: [
          { center: [0, 0, 0], radius: 4 }
        ],
        dropInterval: 35,
        fallSpeed: 2.5,
        minHeight: 12
      }
    };
  },

  getIntroData() {
    return {
      cameraPath: [
        { pos: [0, 0.6, 8], target: [0, 0.5, 0], duration: 2.5, fadeTime: 0.5 },
        { pos: [6, 0.6, 3], target: [0, 0.5, 0], duration: 2, fadeTime: 0.5 }
      ]
    };
  },

  buildThumbnail(targetScene, callback) {
    var self = this;

    function addModel(pluginId, config) {
      var p = plugin.get(pluginId);
      if (!p || !p.enabled || typeof p.createModel !== 'function') return;
      try {
        var result = p.createModel(config);
        if (result && result.mesh) targetScene.add(result.mesh);
      } catch (e) {}
    }

    addModel('map_skybox_day', {});
    addModel('map_sun', { position: [10, 20, 15], targetX: 0, targetZ: 0, intensity: 1.2, ambientIntensity: 0.45, hemiIntensity: 0.35, castShadow: false });

    var size = 30;
    var floorMat = new THREE.MeshStandardMaterial({ color: 0x6a7a7a, roughness: 0.7 });
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x8a9a9a, roughness: 0.6 });

    var floor = new THREE.Mesh(new THREE.BoxGeometry(size, 0.3, size), floorMat);
    floor.position.set(0, -0.15, 0);
    targetScene.add(floor);

    var wallH = 3, wallT = 0.3;
    var walls = [
      { pos: [0, wallH / 2, -size / 2], scale: [size, wallH, wallT] },
      { pos: [0, wallH / 2, size / 2], scale: [size, wallH, wallT] },
      { pos: [-size / 2, wallH / 2, 0], scale: [wallT, wallH, size] },
      { pos: [size / 2, wallH / 2, 0], scale: [wallT, wallH, size] }
    ];
    walls.forEach(function(w) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w.scale[0], w.scale[1], w.scale[2]), wallMat);
      m.position.set(w.pos[0], w.pos[1], w.pos[2]);
      targetScene.add(m);
    });

    callback();
  },

  getColliders() {
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
