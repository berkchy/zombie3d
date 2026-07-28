var plugin = include('registry');
plugin.register({
  id: 'map_night_crypt',
  name: 'Mezar',
  type: 'map_model',
  version: '1.0',
  description: 'Tas mezar/türbe — siper olarak kullanilir',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];
    var rotY = config.rotationY || 0;

    var stoneMat = new THREE.MeshStandardMaterial({ color: config.color || 0x4a4a5a, roughness: 0.9 });

    var base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.5), stoneMat);
    base.position.set(cx, cy + 0.075, cz);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    var lid = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.45), stoneMat);
    lid.position.set(cx, cy + 0.23, cz);
    lid.castShadow = true;
    group.add(lid);

    var top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.4), stoneMat);
    top.position.set(cx, cy + 0.34, cz);
    top.castShadow = true;
    group.add(top);

    var crossMat = new THREE.MeshStandardMaterial({ color: 0x5a5a6a, roughness: 0.7 });
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), crossMat);
    post.position.set(cx, cy + 0.48, cz);
    group.add(post);
    var bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), crossMat);
    bar.position.set(cx, cy + 0.55, cz);
    group.add(bar);

    group.rotation.y = rotY;

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});
