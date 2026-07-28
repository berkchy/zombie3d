var plugin = include('registry');
plugin.register({
  id: 'map_night_statue',
  name: 'Gargoyle Heykel',
  type: 'map_model',
  version: '1.0',
  description: 'Gargoyle heykeli — isildayan gozler, gece atmosferi',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];
    var rotY = config.rotationY || 0;
    var scale = config.scale || 1;

    var stoneMat = new THREE.MeshStandardMaterial({ color: config.color || 0x4a4a5a, roughness: 0.85, metalness: 0.05 });

    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 0.15 * scale, 8), stoneMat);
    base.position.set(cx, cy + 0.075 * scale, cz);
    base.castShadow = true;
    group.add(base);

    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.22 * scale, 0.5 * scale, 8), stoneMat);
    body.position.set(cx, cy + 0.4 * scale, cz);
    body.castShadow = true;
    group.add(body);

    var chest = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 8, 8), stoneMat);
    chest.position.set(cx, cy + 0.65 * scale, cz);
    chest.scale.set(1, 0.7, 0.8);
    chest.castShadow = true;
    group.add(chest);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.1 * scale, 8, 8), stoneMat);
    head.position.set(cx, cy + 0.8 * scale, cz);
    head.scale.set(0.9, 0.8, 0.9);
    head.castShadow = true;
    group.add(head);

    var hornMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6 });
    for (var h = -1; h <= 1; h += 2) {
      var horn = new THREE.Mesh(new THREE.ConeGeometry(0.03 * scale, 0.12 * scale, 6), hornMat);
      horn.position.set(cx + h * 0.06 * scale, cy + 0.85 * scale, cz - 0.04 * scale);
      horn.rotation.x = h * 0.3;
      group.add(horn);
    }

    var eyeMat = new THREE.MeshStandardMaterial({ color: 0x44ff88, emissive: 0x22ff66, emissiveIntensity: 0.5 });
    var eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025 * scale, 6, 6), eyeMat);
    eyeL.position.set(cx - 0.04 * scale, cy + 0.8 * scale, cz - 0.08 * scale);
    group.add(eyeL);
    var eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.025 * scale, 6, 6), eyeMat);
    eyeR.position.set(cx + 0.04 * scale, cy + 0.8 * scale, cz - 0.08 * scale);
    group.add(eyeR);

    var wingMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.8, side: THREE.DoubleSide });
    for (var w = -1; w <= 1; w += 2) {
      var wing = new THREE.Mesh(new THREE.BoxGeometry(0.04 * scale, 0.25 * scale, 0.15 * scale), wingMat);
      wing.position.set(cx + w * 0.25 * scale, cy + 0.6 * scale, cz);
      wing.rotation.z = w * 0.4;
      wing.rotation.x = -0.2;
      wing.castShadow = true;
      group.add(wing);
    }

    group.rotation.y = rotY;

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});
