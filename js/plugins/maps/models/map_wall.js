PluginRegistry.register({
  id: 'map_wall',
  name: 'Sinir Duvari',
  type: 'map_model',
  version: '1.0',
  description: 'Arena sinir duvari',

  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];
    var sx = config.sizeX || 60;
    var sz = config.sizeZ || 0.4;
    var h = config.height || 1.5;

    var wMat = new THREE.MeshStandardMaterial({ color: config.color || 0x6a5a3a, roughness: 0.9 });
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), wMat);
    mesh.position.set(cx, cy + h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    return {
      mesh: group,
      colliders: [{
        min: [cx - sx / 2, cy, cz - sz / 2],
        max: [cx + sx / 2, cy + h, cz + sz / 2],
        walkable: false
      }]
    };
  }
});
