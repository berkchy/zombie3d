var plugin = include('registry');
plugin.register({
  id: 'map_night_tree',
  name: 'Kuru Agac',
  type: 'map_model',
  version: '1.0',
  description: 'Olmus kuru agac — siluet, gece atmosferi',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];
    var scale = config.scale || 1;

    var barkMat = new THREE.MeshStandardMaterial({ color: config.color || 0x3a3a3a, roughness: 0.95 });

    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.06 * scale, 0.8 * scale, 6), barkMat);
    trunk.position.set(cx, cy + 0.4 * scale, cz);
    trunk.castShadow = true;
    group.add(trunk);

    var branchAngles = [
      { x: 0.15, y: 0.4, z: 0.1, rx: 0.5, ry: 0.3 },
      { x: -0.15, y: 0.3, z: -0.1, rx: -0.4, ry: 0.2 },
      { x: 0.1, y: 0.5, z: -0.15, rx: 0.6, ry: -0.3 },
      { x: -0.1, y: 0.35, z: 0.15, rx: -0.3, ry: -0.2 },
      { x: 0.2, y: 0.6, z: 0.05, rx: 0.8, ry: 0.1 },
      { x: -0.18, y: 0.55, z: -0.08, rx: -0.7, ry: -0.1 }
    ];

    branchAngles.forEach(function(b) {
      var branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015 * scale, 0.025 * scale, 0.2 * scale, 5),
        barkMat
      );
      branch.position.set(cx + b.x * scale, cy + b.y * scale, cz + b.z * scale);
      branch.rotation.x = b.rx;
      branch.rotation.z = b.ry;
      branch.castShadow = true;
      group.add(branch);
    });

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});
