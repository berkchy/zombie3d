PluginRegistry.register({
  id: 'model_knife',
  name: 'Bıçak',
  type: 'model',
  version: '2.0',
  description: 'CS:GO tarzı sivri uçlu bıçak — ExtrudeGeometry sivrilen namlu',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    var bladeMat = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      metalness: 0.95,
      roughness: 0.04
    });
    var handleMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      roughness: 0.95,
      metalness: 0
    });
    var guardMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.6,
      roughness: 0.3
    });

    // Kabza (sap)
    var handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.028, 0.085),
      handleMat
    );
    handle.position.set(0, 0, -0.045);
    handle.name = 'handle';
    group.add(handle);

    // Kabza detaylari (tutma halkalari)
    for (var i = 0; i < 4; i++) {
      var ring = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.006),
        new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.9 })
      );
      ring.position.set(0, 0, -0.02 + i * 0.022);
      ring.name = 'grip_ring_' + i;
      group.add(ring);
    }

    // Bicak govdesi (kabza korumasi)
    var guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.01, 0.012),
      guardMat
    );
    guard.position.set(0, 0, 0.0);
    guard.name = 'guard';
    group.add(guard);

    // Namlu — ExtrudeGeometry ile sivrilen uclu bicak
    var shape = new THREE.Shape();
    shape.moveTo(-0.022, 0);
    shape.lineTo(0.022, 0);
    shape.lineTo(0.008, 0.14);
    shape.lineTo(0, 0.17);
    shape.lineTo(-0.008, 0.14);
    shape.closePath();

    var bladeGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.006,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 4
    });

    var blade = new THREE.Mesh(bladeGeo, bladeMat);
    // Shape XY → rotate so blade tip extends along +Z
    blade.rotation.x = Math.PI / 2;
    blade.position.set(0, -0.003, 0);
    blade.name = 'blade';
    group.add(blade);

    // Namlu sivri ucu (isaretci)
    var tip = new THREE.Object3D();
    tip.position.set(0, 0, 0.17);
    tip.name = 'barrel_tip';
    group.add(tip);

    // Namlu sirti (parlak cizgi)
    var spineGeo = new THREE.BoxGeometry(0.004, 0.006, 0.1);
    var spineMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      metalness: 0.98,
      roughness: 0.02
    });
    var spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0.001, 0.08);
    spine.name = 'spine';
    group.add(spine);

    return group;
  }
});
