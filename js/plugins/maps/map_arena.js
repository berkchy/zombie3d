PluginRegistry.register({
  id: 'map_arena',
  name: 'Antik Kalıntılar',
  version: '2.0',
  type: 'map',
  description: 'Antik harabe arenası — plugin tabanli harita objeleri',

  game: null,
  objects: [],
  colliders: [],

  init(game) {
    this.game = game;
    this.objects = [];
    this.colliders = [];
    var scene = game.scene;

    var self = this;

    function addModel(pluginId, config) {
      var p = PluginRegistry.get(pluginId);
      if (!p || !p.enabled || typeof p.createModel !== 'function') return;
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

    // Zemin
    addModel('map_ground', { size: 60, color: 0x9a8a6a });

    // Merkez platform
    addModel('map_platform', { position: [0, 0, 0] });

    // Sutunlar (8 adet, daire)
    for (var i = 0; i < 8; i++) {
      var ag = i * Math.PI / 4 + Math.PI / 8;
      addModel('map_pillar', {
        position: [Math.sin(ag) * 11, 0, Math.cos(ag) * 11],
        height: 3.0,
        radius: 0.45,
        fallen: false
      });
    }

    // Devrik sutunlar (2 adet)
    addModel('map_pillar', {
      position: [-14, 0, -14], fallen: true, length: 2.5, rotX: Math.PI / 2.5, rotZ: 0.3, radius: 0.4
    });
    addModel('map_pillar', {
      position: [14, 0, 14], fallen: true, length: 2.0, rotX: Math.PI / 3, rotZ: -0.4, radius: 0.4
    });

    // Yikik duvarlar
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

    // Mesaleler (4 kose)
    var torches = [[-14, -14], [14, -14], [-14, 14], [14, 14]];
    torches.forEach(function(pos) {
      addModel('map_torch', { position: [pos[0], 0, pos[1]] });
    });

    // Sinir duvarlari
    var H = 30;
    addModel('map_wall', { position: [0, 0, -H], sizeX: 60, sizeZ: 0.4, height: 1.5 });
    addModel('map_wall', { position: [0, 0, H], sizeX: 60, sizeZ: 0.4, height: 1.5 });
    addModel('map_wall', { position: [-H, 0, 0], sizeX: 0.4, sizeZ: 60, height: 1.5 });
    addModel('map_wall', { position: [H, 0, 0], sizeX: 0.4, sizeZ: 60, height: 1.5 });

    // Isik (arena ici)
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

    this.arenaSize = 60;
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
