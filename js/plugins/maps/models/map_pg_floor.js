var plugin = include('registry');
plugin.register({
  id: 'map_pg_floor',
  name: 'Poligon Zemini',
  type: 'map_model',
  version: '1.0',
  description: 'Poligon harita zemini',

  createModel: function(config) {
    var sx = config.sizeX || 36;
    var sz = config.sizeZ || 24;
    var col = config.color || 0x4a4a4a;
    var group = new THREE.Group();

    var mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0;
    mesh.receiveShadow = true;
    group.add(mesh);

    var lineMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.25 });
    var laneMat = new THREE.MeshBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.12 });

    var laneW = sz * 0.12;
    for (var i = -1; i <= 1; i++) {
      var lane = new THREE.Mesh(new THREE.PlaneGeometry(0.03, laneW), laneMat);
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(i * 5, 0.005, 0);
      group.add(lane);
    }

    for (var z = -10; z <= 10; z += 4) {
      if (Math.abs(z) < 0.1) continue;
      var marker = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.04), lineMat);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(0, 0.005, z);
      group.add(marker);
    }

    var edgeMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
    for (var e = 0; e < 2; e++) {
      var edge = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.03, 0.08), edgeMat);
      edge.position.set(0, 0.005, (e === 0 ? -sz/2 + 0.5 : sz/2 - 0.5));
      group.add(edge);
    }

    return {
      mesh: group,
      colliders: [{
        min: [-sx / 2, -0.01, -sz / 2],
        max: [sx / 2, 0, sz / 2],
        walkable: true
      }]
    };
  }
});
