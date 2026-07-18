var plugin = include('registry');
plugin.register({
  id: 'map_ground',
  name: 'Zemin',
  type: 'map_model',
  version: '1.0',
  description: 'Arena zemini + tas desen',

  createModel: function(config) {
    var group = new THREE.Group();
    var size = config.size || 60;
    var half = size / 2;

    var gMat = new THREE.MeshStandardMaterial({ color: config.color || 0x9a8a6a, roughness: 0.95 });
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), gMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    group.add(ground);

    var patMat = new THREE.MeshBasicMaterial({ color: 0x7a6a4a, transparent: true, opacity: 0.15, depthWrite: false });
    for (var r = 3; r <= 15; r += 3) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.05, r + 0.05, 32), patMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.005;
      group.add(ring);
    }
    for (var a = 0; a < 8; a++) {
      var angle = a * Math.PI / 4;
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 15), patMat);
      line.position.set(Math.sin(angle) * 7.5, 0.005, Math.cos(angle) * 7.5);
      line.rotation.y = -angle;
      group.add(line);
    }

    return {
      mesh: group,
      colliders: [{
        min: [-half, -0.01, -half],
        max: [half, 0, half],
        walkable: true
      }]
    };
  }
});
