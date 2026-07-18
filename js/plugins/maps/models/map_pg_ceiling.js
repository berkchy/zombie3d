var plugin = include('registry');
plugin.register({
  id: 'map_pg_ceiling',
  name: 'Poligon Tavani',
  type: 'map_model',
  version: '1.0',
  description: 'Poligon harita tavani',

  createModel: function(config) {
    var sx = config.sizeX || 36;
    var sz = config.sizeZ || 24;
    var y = config.y || 7;
    var col = config.color || 0x555555;
    var group = new THREE.Group();

    var mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.75 });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = y;
    mesh.receiveShadow = true;
    group.add(mesh);

    var beamMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
    for (var i = -1; i <= 1; i++) {
      var beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, sz), beamMat);
      beam.position.set(i * 9, y - 0.05, 0);
      group.add(beam);
    }

    return { mesh: group, colliders: [] };
  }
});
