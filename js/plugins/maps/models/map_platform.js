PluginRegistry.register({
  id: 'map_platform',
  name: 'Merkez Platform',
  type: 'map_model',
  version: '1.0',
  description: 'Yukseltilmis platform + altar + kristal',

  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position ? config.position[0] : 0;
    var cy = config.position ? config.position[1] : 0;
    var cz = config.position ? config.position[2] : 0;
    var colliders = [];

    var pMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.9 });
    var plat = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 0.4, 8), pMat);
    plat.position.set(cx, cy + 0.15, cz);
    plat.receiveShadow = true;
    plat.castShadow = true;
    group.add(plat);

    colliders.push({
      min: [cx - 4.5, cy, cz - 4.5],
      max: [cx + 4.5, cy + 0.35, cz + 4.5],
      walkable: true
    });

    var stepMat = new THREE.MeshStandardMaterial({ color: 0x7a6a4a, roughness: 0.9 });
    for (var d = 0; d < 4; d++) {
      var dirAngle = d * Math.PI / 2;
      for (var s = 0; s < 3; s++) {
        var step = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.35), stepMat);
        var dist = 3.2 + s * 0.4;
        var sx = cx + Math.sin(dirAngle) * dist;
        var sy = cy + 0.04 + s * 0.08;
        var sz = cz + Math.cos(dirAngle) * dist;
        step.position.set(sx, sy, sz);
        step.rotation.y = -dirAngle;
        step.receiveShadow = true;
        group.add(step);

        colliders.push({
          min: [sx - 0.4, sy - 0.04, sz - 0.175],
          max: [sx + 0.4, sy + 0.04, sz + 0.175],
          walkable: true
        });
      }
    }

    var aMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 });
    var aBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.8), aMat);
    aBase.position.set(cx, cy + 0.48, cz);
    aBase.castShadow = true;
    group.add(aBase);

    colliders.push({
      min: [cx - 0.4, cy + 0.35, cz - 0.4],
      max: [cx + 0.4, cy + 0.73, cz + 0.4],
      walkable: false
    });

    var aPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.7 }));
    aPillar.position.set(cx, cy + 0.85, cz);
    aPillar.castShadow = true;
    group.add(aPillar);

    var aTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.6 }));
    aTop.position.set(cx, cy + 1.14, cz);
    aTop.castShadow = true;
    group.add(aTop);

    var cryMat = new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x2288ff, emissiveIntensity: 0.4 });
    var cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), cryMat);
    cry.position.set(cx, cy + 1.25, cz);
    cry.castShadow = true;
    group.add(cry);

    var glow = new THREE.PointLight(0x4488ff, 0.5, 6);
    glow.position.set(cx, cy + 1.5, cz);
    group.add(glow);

    return {
      mesh: group,
      colliders: colliders
    };
  }
});
