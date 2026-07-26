var plugin = include('registry');
plugin.register({
  id: 'map_pit_center',
  name: 'Pit Center',
  type: 'map_model',
  version: '2.0',
  description: 'Orta cubuk',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position ? config.position[0] : 0;
    var cz = config.position ? config.position[2] : 0;
    var r = config.radius || 4.5;
    var depth = config.depth || 6;
    var wMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
    var wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, depth, 24, 1, true), wMat);
    wall.position.set(cx, -depth/2, cz);
    wall.userData.walkable = false;
    group.add(wall);

    var fMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
    var floor = new THREE.Mesh(new THREE.CircleGeometry(r - 0.1, 24), fMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, -depth, cz);
    floor.userData.walkable = true;
    group.add(floor);

    var rMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.6 });
    for (var i = 0; i < 24; i++) {
      var a = i * Math.PI / 12;
      var spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 2, 4), rMat);
      spike.position.set(cx + Math.cos(a) * (r - 0.8), -depth/2, cz + Math.sin(a) * (r - 0.8));
      spike.castShadow = true;
      group.add(spike);
    }

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});