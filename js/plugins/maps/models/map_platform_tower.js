var plugin = include('registry');
plugin.register({
  id: 'map_platform_tower',
  name: 'Platform Tower',
  type: 'map_model',
  version: '2.0',
  description: 'Merdivenli platform',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position ? config.position[0] : 0;
    var cy = config.position ? config.position[1] : 0;
    var cz = config.position ? config.position[2] : 0;
    var h = config.height || 4;
    var w = config.sizeX || 3;
    var d = config.sizeZ || 3;
    var pMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.8 });
    var mMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.3 });

    var base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), pMat);
    base.position.set(cx, cy + 0.15, cz);
    base.receiveShadow = true;
    base.userData.walkable = true;
    group.add(base);

    var pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.8), mMat);
    pillar.position.set(cx, cy + 0.3 + h/2, cz);
    pillar.castShadow = true;
    pillar.userData.walkable = false;
    group.add(pillar);

    var top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4), pMat);
    top.position.set(cx, cy + 0.3 + h, cz);
    top.receiveShadow = true;
    top.castShadow = true;
    top.userData.walkable = true;
    group.add(top);

    for (var i = 0; i < 6; i++) {
      var r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), mMat);
      r.position.set(cx + 0.7, cy + 0.3 + i * 0.6, cz);
      group.add(r);
      var r2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), mMat);
      r2.position.set(cx - 0.7, cy + 0.3 + i * 0.6, cz);
      group.add(r2);
    }

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});