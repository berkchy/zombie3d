var plugin = include('registry');
plugin.register({
  id: 'map_night_lantern_post',
  name: 'Fener Diregi',
  type: 'map_model',
  version: '1.0',
  description: 'Yüksek fener diregi — isiltili lamba',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];

    var poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.3 });
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.5, 8), poleMat);
    pole.position.set(cx, cy + 0.75, cz);
    pole.castShadow = true;
    group.add(pole);

    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.03), poleMat);
    arm.position.set(cx, cy + 1.5, cz);
    group.add(arm);

    var cageMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.2, wireframe: false });
    var cage = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8), cageMat);
    cage.position.set(cx, cy + 1.32, cz);
    group.add(cage);

    var lampMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff6600, emissiveIntensity: 0.4 });
    var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), lampMat);
    lamp.position.set(cx, cy + 1.32, cz);
    group.add(lamp);

    var glowMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.06, depthWrite: false });
    var glow = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), glowMat);
    glow.position.set(cx, cy + 1.32, cz);
    group.add(glow);

    var pl = new THREE.PointLight(0xff8800, 0.3, 5);
    pl.position.set(cx, cy + 1.35, cz);
    group.add(pl);

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});
