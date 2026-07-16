PluginRegistry.register({
  id: 'map_torch',
  name: 'Mesale',
  type: 'map_model',
  version: '1.0',
  description: 'Mesale + ates isigi',

  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];

    var tMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 });
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6), tMat);
    pole.position.set(cx, cy + 0.6, cz);
    pole.castShadow = true;
    group.add(pole);

    var fireMat = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff4400, emissiveIntensity: 0.6 });
    var fire = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), fireMat);
    fire.position.set(cx, cy + 1.25, cz);
    group.add(fire);

    var pl = new THREE.PointLight(0xff6600, 0.6, 8);
    pl.position.set(cx, cy + 1.3, cz);
    group.add(pl);

    return {
      mesh: group,
      colliders: [{
        min: [cx - 0.08, cy, cz - 0.08],
        max: [cx + 0.08, cy + 1.3, cz + 0.08],
        walkable: false
      }]
    };
  }
});
