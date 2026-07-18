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

  init(game) {
    this.game = game;
    this.objects = [];
    this.colliders = [];
    this._ready = false;
  },

  update(dt) {
    if (this._ready) return;
    if (!this.game || !this.game.currentMap || this.game.currentMap.id !== 'empty') return;
    this._ready = true;
    this._buildMap();
  },

  _buildMap() {
    var scene = this.game.scene;

    var amb = new THREE.AmbientLight(0x8899bb, 0.5);
    scene.add(amb);
    this.objects.push(amb);

    var sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(10, 20, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    var d = 25;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.camera.far = 40;
    scene.add(sun);
    this.objects.push(sun);

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
      }
    };
  },

  getIntroData() {
    return {
      cameraPath: [
        { pos: [0, 12, 16], target: [0, 0, 0], duration: 3 },
        { pos: [0, 10, 0], target: [0, 0, 0], duration: 2 }
      ],
      aboveHeight: 3
    };
  },

  buildThumbnail(targetScene, callback) {
    var amb = new THREE.AmbientLight(0x8899bb, 0.5);
    targetScene.add(amb);
    var sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(10, 20, 15);
    targetScene.add(sun);

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
