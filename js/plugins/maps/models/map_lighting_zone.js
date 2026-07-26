var plugin = include('registry');
plugin.register({
  id: 'map_lighting_zone',
  name: 'Lighting Zone',
  type: 'map_model',
  version: '2.0',
  description: 'Aydinlatma armaturu',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position ? config.position[0] : 0;
    var cy = config.position ? config.position[1] : 0;
    var cz = config.position ? config.position[2] : 0;

    var lMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.4 });
    var housing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.4), lMat);
    housing.position.set(cx, cy, cz);
    group.add(housing);

    var p = new THREE.PointLight(0xffdd88, 0.8, 12);
    p.position.set(cx, cy - 0.2, cz);
    group.add(p);

    var gMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, transparent: true, opacity: 0.15 });
    var glow = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), gMat);
    glow.position.set(cx, cy - 0.2, cz);
    group.add(glow);

    return {
      mesh: group,
      colliders: []
    };
  }
});