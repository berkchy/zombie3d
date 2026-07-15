PluginRegistry.register({
  id: 'model_zombie',
  name: 'Zombi',
  type: 'model',
  version: '1.2',
  description: 'Detayli zombi modeli + skeleton',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    var skinMat = new THREE.MeshStandardMaterial({ color: 0x6b8e5a, roughness: 0.85 });
    var darkSkinMat = new THREE.MeshStandardMaterial({ color: 0x4a6a3a, roughness: 0.9 });
    var pantsMat = new THREE.MeshStandardMaterial({ color: 0x3a2a2a, roughness: 0.85 });
    var shirtMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, roughness: 0.8 });
    var bootMat = new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 0.9 });
    var eyeMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 0.5 });
    var toothMat = new THREE.MeshStandardMaterial({ color: 0xccbb88, roughness: 0.9 });
    var woundMat = new THREE.MeshStandardMaterial({ color: 0x661122, roughness: 0.8 });
    var bloodMat = new THREE.MeshStandardMaterial({ color: 0x441111, roughness: 0.9 });

    // ===== ISKELET PIVOTLARI =====
    var hip = new THREE.Object3D();
    hip.name = 'hip';
    hip.position.set(0, 0.26, 0.02);
    group.add(hip);

    var torsoPivot = new THREE.Object3D();
    torsoPivot.name = 'torso';
    torsoPivot.position.set(0, 0.16, 0.02);
    hip.add(torsoPivot);

    var headPivot = new THREE.Object3D();
    headPivot.name = 'head';
    headPivot.position.set(0, 0.26, -0.04);
    torsoPivot.add(headPivot);

    var legLPivot = new THREE.Object3D();
    legLPivot.name = 'legL';
    legLPivot.position.set(-0.13, -0.12, -0.02);
    hip.add(legLPivot);

    var legRPivot = new THREE.Object3D();
    legRPivot.name = 'legR';
    legRPivot.position.set(0.13, -0.12, 0.02);
    hip.add(legRPivot);

    var shoulderLPivot = new THREE.Object3D();
    shoulderLPivot.name = 'shoulderL';
    shoulderLPivot.position.set(-0.24, 0.16, 0.02);
    torsoPivot.add(shoulderLPivot);

    var shoulderRPivot = new THREE.Object3D();
    shoulderRPivot.name = 'shoulderR';
    shoulderRPivot.position.set(0.24, 0.16, 0.02);
    torsoPivot.add(shoulderRPivot);

    var armLPivot = new THREE.Object3D();
    armLPivot.name = 'armL';
    armLPivot.position.set(0, -0.15, 0);
    shoulderLPivot.add(armLPivot);

    var armRPivot = new THREE.Object3D();
    armRPivot.name = 'armR';
    armRPivot.position.set(0, -0.15, 0);
    shoulderRPivot.add(armRPivot);

    // ===== GOVDE =====
    var torsoGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.33, 6);
    var torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.set(0, 0, 0);
    torso.castShadow = true;
    torso.name = 'torso';
    torsoPivot.add(torso);

    var tearGeo = new THREE.BoxGeometry(0.15, 0.08, 0.005);
    var tearMat = new THREE.MeshStandardMaterial({ color: 0x5a5a4a, roughness: 0.9 });
    var tear = new THREE.Mesh(tearGeo, tearMat);
    tear.position.set(0.1, 0.03, 0.21);
    tear.name = 'shirt_tear';
    torsoPivot.add(tear);

    var woundGeo = new THREE.SphereGeometry(0.05, 4, 4);
    var wound = new THREE.Mesh(woundGeo, woundMat);
    wound.position.set(-0.08, 0.06, 0.21);
    wound.scale.set(1, 0.4, 0.3);
    wound.name = 'wound_chest';
    torsoPivot.add(wound);

    // ===== BACAKLAR =====
    var legGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.28, 5);
    var legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(0, 0, 0);
    legL.castShadow = true;
    legL.name = 'legL_mesh';
    legLPivot.add(legL);

    var legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0, 0, 0);
    legR.castShadow = true;
    legR.name = 'legR_mesh';
    legRPivot.add(legR);

    // ===== BOTLAR =====
    var bootGeo = new THREE.BoxGeometry(0.11, 0.06, 0.16);
    var bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(0, -0.14, -0.02);
    bootL.name = 'bootL';
    legLPivot.add(bootL);

    var bootR = new THREE.Mesh(bootGeo, bootMat);
    bootR.position.set(0, -0.14, 0.02);
    bootR.name = 'bootR';
    legRPivot.add(bootR);

    // ===== OMUZLAR =====
    var shGeo = new THREE.SphereGeometry(0.08, 5, 5);
    var shL = new THREE.Mesh(shGeo, shirtMat);
    shL.position.set(0, 0, 0);
    shL.name = 'shoulderL_mesh';
    shoulderLPivot.add(shL);

    var shR = new THREE.Mesh(shGeo, shirtMat);
    shR.position.set(0, 0, 0);
    shR.name = 'shoulderR_mesh';
    shoulderRPivot.add(shR);

    // ===== KOLLAR =====
    var armGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.26, 5);
    var armL = new THREE.Mesh(armGeo, shirtMat);
    armL.position.set(0, -0.13, 0);
    armL.castShadow = true;
    armL.name = 'armL_mesh';
    armLPivot.add(armL);

    var armR = new THREE.Mesh(armGeo, shirtMat);
    armR.position.set(0, -0.13, 0);
    armR.castShadow = true;
    armR.name = 'armR_mesh';
    armRPivot.add(armR);

    // ===== ELLER =====
    var handGeo = new THREE.SphereGeometry(0.04, 4, 4);
    var handL = new THREE.Mesh(handGeo, darkSkinMat);
    handL.position.set(0, -0.13, 0);
    handL.name = 'handL';
    armLPivot.add(handL);

    var handR = new THREE.Mesh(handGeo, darkSkinMat);
    handR.position.set(0, -0.13, 0);
    handR.name = 'handR';
    armRPivot.add(handR);

    // ===== BOYUN =====
    var neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.04, 5);
    var neck = new THREE.Mesh(neckGeo, darkSkinMat);
    neck.position.set(0, 0, 0);
    neck.name = 'neck';
    headPivot.add(neck);

    // ===== KAFA =====
    var headGeo = new THREE.SphereGeometry(0.2, 7, 7);
    var head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.05, 0);
    head.scale.set(1, 1.15, 0.9);
    head.castShadow = true;
    head.name = 'head';
    headPivot.add(head);

    // var jawGeo = new THREE.SphereGeometry(0.14, 5, 4, 0, Math.PI * 2, Math.PI / 3, Math.PI / 2);
    // var jaw = new THREE.Mesh(jawGeo, darkSkinMat);
    // jaw.position.set(0, 0, 0.1);
    // jaw.scale.set(1, 0.7, 0.8);
    // jaw.name = 'jaw';
    // headPivot.add(jaw);

    // ===== GOZLER =====
    var eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    var socketMat = new THREE.MeshStandardMaterial({ color: 0x2a3a1a, roughness: 0.9 });

    var eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 0.02, 0.18);
    eyeL.name = 'eyeL';
    headPivot.add(eyeL);

    var eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 0.02, 0.18);
    eyeR.name = 'eyeR';
    headPivot.add(eyeR);

    var socketGeo = new THREE.SphereGeometry(0.055, 5, 5);
    var socketL = new THREE.Mesh(socketGeo, socketMat);
    socketL.position.set(-0.08, 0.02, 0.19);
    socketL.scale.set(1, 0.6, 0.5);
    socketL.name = 'socketL';
    headPivot.add(socketL);

    var socketR = new THREE.Mesh(socketGeo, socketMat);
    socketR.position.set(0.08, 0.02, 0.19);
    socketR.scale.set(1, 0.6, 0.5);
    socketR.name = 'socketR';
    headPivot.add(socketR);

    // ===== DISLER =====
    // for (var ti = 0; ti < 4; ti++) {
    //   var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.01), toothMat);
    //   tooth.position.set((ti - 1.5) * 0.025, -0.04, 0.2);
    //   tooth.rotation.z = (ti - 1.5) * 0.1;
    //   tooth.name = 'tooth_top_' + ti;
    //   headPivot.add(tooth);
    // }
    // 
    // for (var bi = 0; bi < 3; bi++) {
    //   var t2 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, 0.01), toothMat);
    //   t2.position.set((bi - 1) * 0.025, -0.07, 0.19);
    //   t2.name = 'tooth_bot_' + bi;
    //   headPivot.add(t2);
    // }

    // ===== YARALAR =====
    var wound2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), woundMat);
    wound2.position.set(0, -0.15, 0);
    wound2.scale.set(0.5, 1, 0.5);
    wound2.name = 'wound_arm';
    armRPivot.add(wound2);

    var gashGeo = new THREE.BoxGeometry(0.06, 0.01, 0.02);
    var gash = new THREE.Mesh(gashGeo, woundMat);
    gash.position.set(0.05, 0.08, 0.12);
    gash.rotation.z = 0.3;
    gash.name = 'head_gash';
    headPivot.add(gash);

    // ===== KEMER =====
    var beltMatZ = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });
    var beltGeoZ = new THREE.TorusGeometry(0.19, 0.02, 3, 8);
    var beltZ = new THREE.Mesh(beltGeoZ, beltMatZ);
    beltZ.position.set(0, -0.16, 0.12);
    beltZ.rotation.x = Math.PI / 2;
    beltZ.name = 'belt';
    torsoPivot.add(beltZ);

    return group;
  },

  animations: {
    idle: {
      duration: 2.0,
      loop: true,
      tracks: [
        { pivot: 'armL', prop: 'rotation.x', keys: [0.1, 0.2, 0.1] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.3, -0.2, -0.3] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0.15, 0.12, 0.15] },
        { pivot: 'head', prop: 'rotation.x', keys: [-0.05, 0, -0.05] }
      ]
    },
    walk: {
      duration: 0.8,
      loop: true,
      tracks: [
        { pivot: 'armL', prop: 'rotation.x', keys: [0.1, -0.3, 0.1] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.3, 0.3, -0.3] },
        { pivot: 'legL', prop: 'rotation.x', keys: [0, 0.3, 0] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0, -0.3, 0] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0.15, 0.1, 0.15] }
      ]
    },
    die: {
      duration: 0.7,
      loop: false,
      tracks: [
        { pivot: 'hip', prop: 'position.z', keys: [0, -0.4] },
        { pivot: 'hip', prop: 'position.y', keys: [0.26, 0.3, 0.02] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0.15, -0.95] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0.15, 0.4] },
        { pivot: 'head', prop: 'rotation.x', keys: [-0.05, 0.6] },
        { pivot: 'legL', prop: 'rotation.x', keys: [0, 0.35] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0, -0.35] },
        { pivot: 'armL', prop: 'rotation.x', keys: [0.1, -0.65] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.3, -0.75] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0, 0.3] },
        { pivot: 'armR', prop: 'rotation.z', keys: [0, -0.3] }
      ]
    }
  }
});
