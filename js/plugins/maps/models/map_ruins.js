var plugin = include('registry');
plugin.register({
  id: 'map_ruins',
  name: 'Yikik Duvar',
  type: 'map_model',
  version: '1.0',
  description: 'Yikik duvar parcasi — siper',

  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];
    var sx = config.sizeX || 2.5;
    var sz = config.sizeZ || 0.4;
    var h = config.height || 1.0;

    var rMat = new THREE.MeshStandardMaterial({ color: config.color || 0x6a5a3a, roughness: 0.9 });
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), rMat);
    mesh.position.set(cx, cy + h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.walkable = config.walkable !== undefined ? config.walkable : (h <= 0.4);
    group.add(mesh);

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});
