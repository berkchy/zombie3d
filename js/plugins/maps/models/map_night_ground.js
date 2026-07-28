var plugin = include('registry');
plugin.register({
  id: 'map_night_ground',
  name: 'Gece Zemini',
  type: 'map_model',
  version: '1.0',
  description: 'Koyu tas döseme + ay isigi yansimasi',
  createModel: function(config) {
    var group = new THREE.Group();
    var size = config.size || 60;
    var gMat = new THREE.MeshStandardMaterial({
      color: config.color || 0x2a2a3a,
      roughness: 0.9,
      metalness: 0.1
    });
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), gMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.userData.walkable = true;
    group.add(ground);

    var rimMat = new THREE.MeshBasicMaterial({
      color: 0x445566,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    for (var r = 4; r <= 20; r += 4) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.06, r + 0.06, 48), rimMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.006;
      group.add(ring);
    }
    for (var a = 0; a < 12; a++) {
      var angle = a * Math.PI / 6;
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 18), rimMat);
      line.position.set(Math.sin(angle) * 9, 0.006, Math.cos(angle) * 9);
      line.rotation.y = -angle;
      group.add(line);
    }

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});
