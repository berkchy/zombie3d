var plugin = include('registry');
plugin.register({
  id: 'map_cover_wall',
  name: 'Cover Wall',
  type: 'map_model',
  version: '2.0',
  description: 'Siper duvari',
  createModel: function(config) {
    var group = new THREE.Group();
    var sx = config.sizeX || 8;
    var sz = config.sizeZ || 0.3;
    var h = config.height || 12;
    var cx = config.position ? config.position[0] : 0;
    var cz = config.position ? config.position[2] : 0;
    if (config.type === 'tactical_shelter') {
      var wMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.85 });
      for (var i = 0; i < 3; i++) {
        var w = new THREE.Mesh(new THREE.BoxGeometry(3, h, sz), wMat);
        w.position.set(cx + i * 3.5, h/2, cz);
        w.castShadow = true;
        w.receiveShadow = true;
        w.userData.walkable = false;
        group.add(w);
      }
      return { mesh: group, colliders: ColliderHelper.extractColliders(group) };
    }

    var wMat = new THREE.MeshStandardMaterial({ color: config.color || 0x888888, roughness: 0.8 });
    var w = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), wMat);
    w.position.set(cx, h/2, cz);
    w.castShadow = true;
    w.receiveShadow = true;
    w.userData.walkable = false;
    group.add(w);

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});