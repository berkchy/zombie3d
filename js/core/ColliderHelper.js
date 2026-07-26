window.ColliderHelper = (function() {

  function extractColliders(group) {
    var colliders = [];
    var tmpPos = new THREE.Vector3();
    var tmpQuat = new THREE.Quaternion();
    var tmpEuler = new THREE.Euler();
    var tmpCenter = new THREE.Vector3();
    var tmpWbb = new THREE.Box3();

    group.traverse(function(child) {
      if (!child.isMesh) return;
      if (!child.geometry) return;
      if (child.userData.walkable === undefined) return;

      child.geometry.computeBoundingBox();
      var bb = child.geometry.boundingBox;

      child.getWorldPosition(tmpPos);
      child.getWorldQuaternion(tmpQuat);

      var hx = (bb.max.x - bb.min.x) / 2;
      var hy = (bb.max.y - bb.min.y) / 2;
      var hz = (bb.max.z - bb.min.z) / 2;

      tmpCenter.set(bb.min.x + hx, bb.min.y + hy, bb.min.z + hz);
      tmpCenter.applyQuaternion(tmpQuat);
      tmpCenter.add(tmpPos);

      tmpEuler.setFromQuaternion(tmpQuat);
      var angle = tmpEuler.y;

      tmpWbb.setFromObject(child);

      colliders.push({
        min: [tmpWbb.min.x, tmpWbb.min.y, tmpWbb.min.z],
        max: [tmpWbb.max.x, tmpWbb.max.y, tmpWbb.max.z],
        walkable: child.userData.walkable,
        center: [tmpCenter.x, tmpCenter.y, tmpCenter.z],
        half: [hx, hy, hz],
        angle: angle
      });
    });

    return colliders;
  }

  function fromGroup(group, walkable) {
    var bb = new THREE.Box3().setFromObject(group);
    return [{
      min: [bb.min.x, bb.min.y, bb.min.z],
      max: [bb.max.x, bb.max.y, bb.max.z],
      walkable: walkable === true,
      center: [(bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, (bb.min.z + bb.max.z) / 2],
      half: [(bb.max.x - bb.min.x) / 2, (bb.max.y - bb.min.y) / 2, (bb.max.z - bb.min.z) / 2],
      angle: 0
    }];
  }

  function circleVsBox(px, pz, radius, collider) {
    var cx = collider.center[0];
    var cz = collider.center[2];
    var hx = collider.half[0];
    var hz = collider.half[2];
    var angle = collider.angle || 0;

    var dx = px - cx;
    var dz = pz - cz;

    if (angle !== 0) {
      var cos = Math.cos(-angle);
      var sin = Math.sin(-angle);
      var lx = dx * cos - dz * sin;
      var lz = dx * sin + dz * cos;
      dx = lx; dz = lz;
    }

    var closestX = Math.max(-hx, Math.min(hx, dx));
    var closestZ = Math.max(-hz, Math.min(hz, dz));
    var diffX = dx - closestX;
    var diffZ = dz - closestZ;
    var distSq = diffX * diffX + diffZ * diffZ;

    if (distSq < radius * radius) {
      if (distSq > 0.0001) {
        var dist = Math.sqrt(distSq);
        var overlap = radius - dist;
        dx += (diffX / dist) * overlap;
        dz += (diffZ / dist) * overlap;
      } else {
        var ox = hx - Math.abs(dx) + 0.001;
        var oz = hz - Math.abs(dz) + 0.001;
        if (ox < oz) {
          dx += (dx >= 0 ? ox + radius : -(ox + radius));
        } else {
          dz += (dz >= 0 ? oz + radius : -(oz + radius));
        }
      }

      if (angle !== 0) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        px = cx + dx * cos - dz * sin;
        pz = cz + dx * sin + dz * cos;
      } else {
        px = cx + dx;
        pz = cz + dz;
      }
    }

    return { x: px, z: pz };
  }

  function pointInBox(px, pz, collider) {
    if (collider.angle) {
      var dx = px - collider.center[0];
      var dz = pz - collider.center[2];
      var cos = Math.cos(-collider.angle);
      var sin = Math.sin(-collider.angle);
      var lx = dx * cos - dz * sin;
      var lz = dx * sin + dz * cos;
      return Math.abs(lx) <= collider.half[0] && Math.abs(lz) <= collider.half[2];
    }
    return px >= collider.min[0] && px <= collider.max[0] &&
           pz >= collider.min[2] && pz <= collider.max[2];
  }

  return {
    extractColliders: extractColliders,
    fromGroup: fromGroup,
    circleVsBox: circleVsBox,
    pointInBox: pointInBox
  };
})();
