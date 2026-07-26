var plugin = include('registry');
plugin.register({
  id: 'map_spawn_platforms',
  name: 'Spawn Platform',
  type: 'map_model',
  version: '2.0',
  description: 'Dogum platformu',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position ? config.position[0] : 0;
    var cz = config.position ? config.position[2] : 0;
    var w = config.sizeX || 2;
    var d = config.sizeZ || 2;

    var pMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.85 });
    var plat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), pMat);
    plat.position.set(cx, 0.1, cz);
    plat.receiveShadow = true;
    plat.userData.walkable = true;
    group.add(plat);

    var mMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.6, metalness: 0.3 });
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), mMat);
    pole.position.set(cx, 0.5, cz);
    group.add(pole);

    var lMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.3 });
    var light = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), lMat);
    light.position.set(cx, 0.9, cz);
    group.add(light);

    var pl = new THREE.PointLight(0x4488ff, 0.5, 6);
    pl.position.set(cx, 0.9, cz);
    group.add(pl);

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});