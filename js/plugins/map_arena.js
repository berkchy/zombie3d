PluginRegistry.register({
  id: 'map_arena',
  name: 'Arena Haritası',
  version: '1.0',
  type: 'map',
  description: 'Zombie survivor arenası',

  game: null,
  objects: [],

  init(game) {
    this.game = game;
    const scene = game.scene;

    // Zemin
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d1b0e,
      roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
    this.objects.push(ground);

    // Grid yardım
    const grid = new THREE.GridHelper(60, 30, 0x444444, 0x333333);
    grid.position.y = 0;
    scene.add(grid);
    this.objects.push(grid);

    // Sınır duvarları
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.6 });
    const wallH = 1;
    const wallT = 0.3;
    const half = 30;

    const walls = [
      { x: 0, z: -half, sx: 60, sz: wallT }, // arka
      { x: 0, z: half, sx: 60, sz: wallT },  // ön
      { x: -half, z: 0, sx: wallT, sz: 60 },  // sol
      { x: half, z: 0, sx: wallT, sz: 60 }    // sağ
    ];
    walls.forEach(function(w) {
      const geo = new THREE.BoxGeometry(w.sx, wallH, w.sz);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(w.x, wallH / 2, w.z);
      mesh.castShadow = true;
      scene.add(mesh);
      this.objects.push(mesh);
    }, this);

    // Işık
    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(ambient);
    this.objects.push(ambient);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    const d = 35;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 50;
    scene.add(dirLight);
    this.objects.push(dirLight);

    this.arenaSize = 60;
  },

  destroy() {
    const scene = this.game ? this.game.scene : null;
    if (!scene) return;
    this.objects.forEach(function(obj) {
      scene.remove(obj);
    });
    this.objects = [];
  }
});
