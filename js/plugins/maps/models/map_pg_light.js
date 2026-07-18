var plugin = include('registry');
plugin.register({
  id: 'map_pg_light',
  name: 'Poligon Lambasi',
  type: 'map_model',
  version: '1.0',
  description: 'Tavan aydinlatma lambasi',

  createModel: function(config) {
    var p = config.position;
    var group = new THREE.Group();

    var housingMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.3 });
    var housing = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.12, 10), housingMat);
    housing.position.set(p[0], p[1], p[2]);
    housing.rotation.x = Math.PI;
    group.add(housing);

    var glowMat = new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.12 });
    var glow = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 8), glowMat);
    glow.position.set(p[0], p[1] - 0.15, p[2]);
    group.add(glow);

    var bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeecc });
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), bulbMat);
    bulb.position.set(p[0], p[1] - 0.04, p[2]);
    group.add(bulb);

    var stemMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3, roughness: 0.4 });
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6), stemMat);
    stem.position.set(p[0], p[1] + 0.09, p[2]);
    group.add(stem);

    return { mesh: group, colliders: [] };
  }
});
