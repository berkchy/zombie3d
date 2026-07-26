var plugin = include('registry');
plugin.register({
  id: 'map_ground_advanced',
  name: 'Advanced Ground',
  type: 'map_model',
  version: '2.0',
  description: 'Multi-layer arena zemin',
  createModel: function(config) {
    var group = new THREE.Group();
    var sx = config.sizeX || 36;
    var sz = config.sizeZ || 24;
    var gMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });
    var g = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.3, sz), gMat);
    g.position.set(0, -0.15, 0);
    g.receiveShadow = true;
    g.userData.walkable = true;
    group.add(g);

    var pMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7 });
    for (var i = 0; i < 8; i++) {
      var angle = i * Math.PI / 4;
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 8), pMat);
      line.position.set(Math.sin(angle) * 5, 0.01, Math.cos(angle) * 5);
      line.rotation.y = -angle;
      group.add(line);
    }

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});