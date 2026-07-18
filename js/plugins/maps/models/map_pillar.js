var plugin = include('registry');
plugin.register({
  id: 'map_pillar',
  name: 'Sutun',
  type: 'map_model',
  version: '1.0',
  description: 'Ayakta veya devrik sutun',

  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];
    var height = config.height || 3.0;
    var radius = config.radius || 0.45;
    var fallen = config.fallen || false;
    var colliders = [];

    var cMat = new THREE.MeshStandardMaterial({ color: config.color || 0x8a7a5a, roughness: 0.85 });

    if (fallen) {
      var len = config.length || 2.5;
      var fall = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.8, radius * 0.9, len, 8), cMat);
      var rx = config.rotX || 0;
      var rz = config.rotZ || 0;
      fall.rotation.x = rx;
      fall.rotation.z = rz;
      fall.position.set(cx, cy + 0.2, cz);
      fall.castShadow = true;
      group.add(fall);

      var halfLen = len / 2;
      var euler = new THREE.Euler(rx, 0, rz, 'XYZ');
      var pts = [];
      // Cylinder ekseninin iki ucu
      var v = new THREE.Vector3(0, -halfLen, 0);
      v.applyEuler(euler); pts.push(v.x + cx, v.y + cy + 0.2, v.z + cz);
      v.set(0, halfLen, 0);
      v.applyEuler(euler); pts.push(v.x + cx, v.y + cy + 0.2, v.z + cz);
      // Yuzeydeki dort nokta (orta kesitte)
      var r = radius * 0.85;
      [
        [r, 0, 0], [-r, 0, 0],
        [0, 0, r], [0, 0, -r]
      ].forEach(function(p) {
        v.set(p[0], p[1], p[2]);
        v.applyEuler(euler);
        pts.push(v.x + cx, v.y + cy + 0.2, v.z + cz);
      });
      // AABB bul
      var minX = Infinity, minY = Infinity, minZ = Infinity;
      var maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (var pi = 0; pi < pts.length; pi += 3) {
        if (pts[pi] < minX) minX = pts[pi];
        if (pts[pi+1] < minY) minY = pts[pi+1];
        if (pts[pi+2] < minZ) minZ = pts[pi+2];
        if (pts[pi] > maxX) maxX = pts[pi];
        if (pts[pi+1] > maxY) maxY = pts[pi+1];
        if (pts[pi+2] > maxZ) maxZ = pts[pi+2];
      }
      colliders.push({
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
        walkable: true
      });
    } else {
      var base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.5, radius * 1.8, 0.2, 10), cMat);
      base.position.set(cx, cy + 0.1, cz);
      base.receiveShadow = true;
      group.add(base);

      colliders.push({
        min: [cx - radius * 1.8, cy, cz - radius * 1.8],
        max: [cx + radius * 1.8, cy + 0.2, cz + radius * 1.8],
        walkable: true
      });

      var col = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.8, radius, height, 10), cMat);
      col.position.set(cx, cy + 0.2 + height / 2, cz);
      col.castShadow = true;
      group.add(col);

      colliders.push({
        min: [cx - radius, cy + 0.2, cz - radius],
        max: [cx + radius, cy + 0.2 + height, cz + radius],
        walkable: false
      });

      var cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.1, radius * 1.3, 0.2, 10), cMat);
      cap.position.set(cx, cy + 0.3 + height, cz);
      cap.castShadow = true;
      group.add(cap);
    }

    return {
      mesh: group,
      colliders: colliders
    };
  }
});
