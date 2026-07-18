var plugin = include('registry');
plugin.register({
  id: 'map_pg_wall',
  name: 'Poligon Duvari',
  type: 'map_model',
  version: '1.0',
  description: 'Poligon harita duvari',

  createModel: function(config) {
    var p = config.position;
    var sx = config.sizeX || 36;
    var sz = config.sizeZ || 0.2;
    var h = config.height || 7;
    var col = config.color || 0x888888;
    var group = new THREE.Group();

    var mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 });
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), mat);
    mesh.position.set(p[0], p[1] + h / 2, p[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    var trimMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4 });
    var trim = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.05, 0.06, sz + 0.05), trimMat);
    trim.position.set(p[0], p[1] + 0.03, p[2]);
    group.add(trim);

    return {
      mesh: group,
      colliders: [{
        min: [p[0] - sx / 2, p[1], p[2] - sz / 2],
        max: [p[0] + sx / 2, p[1] + h, p[2] + sz / 2],
        walkable: false
      }]
    };
  }
});
