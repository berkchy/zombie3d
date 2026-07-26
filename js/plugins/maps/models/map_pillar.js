var plugin = include('registry');
plugin.register({
  id: 'map_pillar',
  name: 'Sutun',
  type: 'map_model',
  version: '1.0',
  description: 'Ayakta veya devrik sutun',

  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];
    var height = config.height || 3.0;
    var radius = config.radius || 0.45;
    var fallen = config.fallen || false;

    var cMat = new THREE.MeshStandardMaterial({ color: config.color || 0x8a7a5a, roughness: 0.85 });

    if (fallen) {
      var len = config.length || 2.5;
      var fall = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.8, radius * 0.9, len, 8), cMat);
      var rx = config.rotX || 0;
      var rz = config.rotZ || 0;
      fall.rotation.x = rx;
      fall.rotation.z = rz;
      fall.position.set(cx, cy + 0.2, cz);
      fall.castShadow = true;
      fall.userData.walkable = true;
      group.add(fall);
    } else {
      var base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.5, radius * 1.8, 0.2, 10), cMat);
      base.position.set(cx, cy + 0.1, cz);
      base.receiveShadow = true;
      base.userData.walkable = true;
      group.add(base);

      var col = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.8, radius, height, 10), cMat);
      col.position.set(cx, cy + 0.2 + height / 2, cz);
      col.castShadow = true;
      col.userData.walkable = false;
      group.add(col);

      var cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.1, radius * 1.3, 0.2, 10), cMat);
      cap.position.set(cx, cy + 0.3 + height, cz);
      cap.castShadow = true;
      group.add(cap);
    }

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});
