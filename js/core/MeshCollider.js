window.MeshCollider = (function() {
  var raycaster = new THREE.Raycaster();
  var o = new THREE.Vector3();
  var d = new THREE.Vector3();
  var tmp = new THREE.Vector3();

  function collectMeshes(root) {
    var list = [];
    if (!root) return list;
    if (root.isMesh && root.geometry) {
      root.geometry.computeBoundingSphere();
      list.push(root);
      return list;
    }
    root.traverse(function(child) {
      if (child.isMesh && child.geometry) {
        child.geometry.computeBoundingSphere();
        list.push(child);
      }
    });
    return list;
  }

  function collectMapMeshes(mapPlugin) {
    var list = [];
    if (mapPlugin && mapPlugin.objects) {
      for (var i = 0; i < mapPlugin.objects.length; i++) {
        list = list.concat(collectMeshes(mapPlugin.objects[i]));
      }
    }
    return list;
  }

  function getFloorY(x, y, z, meshes, stepH) {
    raycaster.set(o.set(x, y + 0.5, z), d.set(0, -1, 0));
    var hits = raycaster.intersectObjects(meshes, false);
    var best = null;
    for (var i = 0; i < hits.length; i++) {
      var n = tmp.copy(hits[i].face.normal).transformDirection(hits[i].object.matrixWorld);
      if (n.y < 0.7) continue;
      var py = hits[i].point.y;
      if (py <= y + stepH && py >= y - 5 && (best === null || py > best)) best = py;
    }
    return best;
  }

  function _testDir(ox, oy, oz, dx, dz, maxDist, meshes) {
    raycaster.set(o.set(ox, oy, oz), d.set(dx, 0, dz).normalize());
    var hits = raycaster.intersectObjects(meshes, false);
    for (var i = 0; i < hits.length; i++) {
      if (hits[i].distance <= maxDist && hits[i].distance > 0.001) {
        var n = tmp.copy(hits[i].face.normal).transformDirection(hits[i].object.matrixWorld);
        if (n.y < 0.7) return true;
      }
    }
    return false;
  }

  function slideMove(ox, oy, oz, dx, dz, meshes, radius, stepH) {
    var blockedX = false, blockedZ = false;

    function wallBlockX(dirX, maxD) {
      var lo = oz - radius * 0.8, hi = oz + radius * 0.8;
      var h1 = oy + 0.3, h2 = oy, h3 = oy - 0.15;
      return _testDir(ox, h1, oz, dirX, 0, maxD, meshes) ||
             _testDir(ox, h1, lo, dirX, 0, maxD, meshes) ||
             _testDir(ox, h1, hi, dirX, 0, maxD, meshes) ||
             _testDir(ox, h2, oz, dirX, 0, maxD, meshes) ||
             _testDir(ox, h2, lo, dirX, 0, maxD, meshes) ||
             _testDir(ox, h2, hi, dirX, 0, maxD, meshes) ||
             _testDir(ox, h3, oz, dirX, 0, maxD, meshes) ||
             _testDir(ox, h3, lo, dirX, 0, maxD, meshes) ||
             _testDir(ox, h3, hi, dirX, 0, maxD, meshes);
    }
    function wallBlockZ(dirZ, maxD) {
      var lo = ox - radius * 0.8, hi = ox + radius * 0.8;
      var h1 = oy + 0.3, h2 = oy, h3 = oy - 0.15;
      return _testDir(ox, h1, oz, 0, dirZ, maxD, meshes) ||
             _testDir(lo, h1, oz, 0, dirZ, maxD, meshes) ||
             _testDir(hi, h1, oz, 0, dirZ, maxD, meshes) ||
             _testDir(ox, h2, oz, 0, dirZ, maxD, meshes) ||
             _testDir(lo, h2, oz, 0, dirZ, maxD, meshes) ||
             _testDir(hi, h2, oz, 0, dirZ, maxD, meshes) ||
             _testDir(ox, h3, oz, 0, dirZ, maxD, meshes) ||
             _testDir(lo, h3, oz, 0, dirZ, maxD, meshes) ||
             _testDir(hi, h3, oz, 0, dirZ, maxD, meshes);
    }

    function _findFloorFwd(ox, oy, oz, dirX, dirZ, stepH, meshes) {
      for (var d = 0.05; d <= stepH * 2; d += 0.05) {
        var fy = getFloorY(ox + dirX * d, oy, oz + dirZ * d, meshes, stepH);
        if (fy !== null && (oy > 0.28 ? fy >= oy - 0.02 : fy > oy + 0.001)) return d;
      }
      return 0;
    }

    var extraX = 0, extraZ = 0;

    if (Math.abs(dx) > 0.0001) {
      var _maxD = Math.abs(dx) + radius + 0.05;
      var dirX = dx > 0 ? 1 : -1;
      var hitWall = wallBlockX(dirX, _maxD);
      if (hitWall) {
        var floorTry = getFloorY(ox + dx, oy, oz, meshes, stepH);
        var allow = floorTry !== null && (oy > 0.28 ? floorTry >= oy - 0.02 : floorTry > oy + 0.001);
        if (!allow) {
          var found = _findFloorFwd(ox + dx, oy, oz, dirX, 0, stepH, meshes);
          if (found !== 0) { allow = true; extraX = dirX * found; }
        }
        if (!allow) blockedX = true;
      }
    }
    if (Math.abs(dz) > 0.0001) {
      var _maxD = Math.abs(dz) + radius + 0.05;
      var dirZ = dz > 0 ? 1 : -1;
      var hitWall = wallBlockZ(dirZ, _maxD);
      if (hitWall) {
        var fx = blockedX ? ox : ox + dx;
        var floorTry = getFloorY(fx, oy, oz + dz, meshes, stepH);
        var allow = floorTry !== null && (oy > 0.28 ? floorTry >= oy - 0.02 : floorTry > oy + 0.001);
        if (!allow) {
          var found = _findFloorFwd(fx, oy, oz + dz, 0, dirZ, stepH, meshes);
          if (found !== 0) { allow = true; extraZ = dirZ * found; }
        }
        if (!allow) blockedZ = true;
      }
    }
    return {
      x: blockedX ? ox : ox + dx + extraX,
      z: blockedZ ? oz : oz + dz + extraZ,
      blockedX: blockedX,
      blockedZ: blockedZ
    };
  }

  return {
    collectMeshes: collectMeshes,
    collectMapMeshes: collectMapMeshes,
    getFloorY: getFloorY,
    slideMove: slideMove
  };
})();
