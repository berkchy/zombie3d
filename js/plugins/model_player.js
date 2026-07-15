PluginRegistry.register({
  id: 'model_player',
  name: 'Oyuncu',
  type: 'model',
  version: '1.2',
  description: 'Detayli oyuncu karakter modeli + skeleton',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, roughness: 0.4, metalness: 0.1 });
    var skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.6 });
    var pantsMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.7 });
    var bootMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 });
    var beltMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.6 });
    var eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    var hairMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 });
    var metalMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.3, metalness: 0.6 });

    // ===== ISKELET PIVOTLARI =====
    var hip = new THREE.Object3D();
    hip.name = 'hip';
    hip.position.set(0, 0.28, 0);
    group.add(hip);

    // Govde pivotu
    var torsoPivot = new THREE.Object3D();
    torsoPivot.name = 'torso';
    torsoPivot.position.set(0, 0.16, 0);
    hip.add(torsoPivot);

    // Kafa pivotu
    var headPivot = new THREE.Object3D();
    headPivot.name = 'head';
    headPivot.position.set(0, 0.28, 0);
    torsoPivot.add(headPivot);

    // Sol bacak pivotu
    var legLPivot = new THREE.Object3D();
    legLPivot.name = 'legL';
    legLPivot.position.set(-0.12, -0.13, 0);
    hip.add(legLPivot);

    // Sag bacak pivotu
    var legRPivot = new THREE.Object3D();
    legRPivot.name = 'legR';
    legRPivot.position.set(0.12, -0.13, 0);
    hip.add(legRPivot);

    // Sol omuz pivotu
    var shoulderLPivot = new THREE.Object3D();
    shoulderLPivot.name = 'shoulderL';
    shoulderLPivot.position.set(-0.24, 0.16, 0);
    torsoPivot.add(shoulderLPivot);

    // Sag omuz pivotu
    var shoulderRPivot = new THREE.Object3D();
    shoulderRPivot.name = 'shoulderR';
    shoulderRPivot.position.set(0.24, 0.16, 0);
    torsoPivot.add(shoulderRPivot);

    // Sol kol pivotu
    var armLPivot = new THREE.Object3D();
    armLPivot.name = 'armL';
    armLPivot.position.set(0, -0.18, 0);
    shoulderLPivot.add(armLPivot);

    // Sag kol pivotu
    var armRPivot = new THREE.Object3D();
    armRPivot.name = 'armR';
    armRPivot.position.set(0, -0.18, 0);
    shoulderRPivot.add(armRPivot);

    // ===== GOVDE =====
    var torsoGeo = new THREE.CylinderGeometry(0.19, 0.16, 0.36, 8);
    var torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.set(0, 0, 0);
    torso.castShadow = true;
    torso.name = 'torso';
    torsoPivot.add(torso);

    var plateGeo = new THREE.BoxGeometry(0.2, 0.14, 0.05);
    var plateMat = new THREE.MeshStandardMaterial({ color: 0x3a9fc7, roughness: 0.3, metalness: 0.4 });
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.06, 0.18);
    plate.name = 'chest_plate';
    torsoPivot.add(plate);

    // ===== KEMER =====
    var beltGeo = new THREE.TorusGeometry(0.17, 0.025, 4, 12);
    var belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, -0.16, 0);
    belt.rotation.x = Math.PI / 2;
    belt.name = 'belt';
    torsoPivot.add(belt);

    var buckleGeo = new THREE.BoxGeometry(0.04, 0.04, 0.02);
    var buckle = new THREE.Mesh(buckleGeo, metalMat);
    buckle.position.set(0, -0.16, 0.14);
    buckle.name = 'buckle';
    torsoPivot.add(buckle);

    // ===== BACAKLAR =====
    var legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.3, 6);
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
    var bootGeo = new THREE.BoxGeometry(0.1, 0.06, 0.16);
    var bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(0, -0.15, 0.02);
    bootL.name = 'bootL';
    legLPivot.add(bootL);

    var bootR = new THREE.Mesh(bootGeo, bootMat);
    bootR.position.set(0, -0.15, 0.02);
    bootR.name = 'bootR';
    legRPivot.add(bootR);

    // ===== OMUZLAR =====
    var shGeo = new THREE.SphereGeometry(0.08, 6, 6);
    var shMat = new THREE.MeshStandardMaterial({ color: 0x3a9fc7, roughness: 0.3, metalness: 0.2 });
    var shL = new THREE.Mesh(shGeo, shMat);
    shL.position.set(0, 0, 0);
    shL.name = 'shoulderL_mesh';
    shoulderLPivot.add(shL);

    var shR = new THREE.Mesh(shGeo, shMat);
    shR.position.set(0, 0, 0);
    shR.name = 'shoulderR_mesh';
    shoulderRPivot.add(shR);

    // ===== KOLLAR =====
    var armGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.28, 6);
    var armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(0, -0.14, 0);
    armL.castShadow = true;
    armL.name = 'armL_mesh';
    armLPivot.add(armL);

    var armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(0, -0.14, 0);
    armR.castShadow = true;
    armR.name = 'armR_mesh';
    armRPivot.add(armR);

    // ===== ELLER =====
    var handGeo = new THREE.SphereGeometry(0.04, 4, 4);
    var handL = new THREE.Mesh(handGeo, skinMat);
    handL.position.set(0, -0.28, 0);
    handL.name = 'handL';
    armLPivot.add(handL);

    var handR = new THREE.Mesh(handGeo, skinMat);
    handR.position.set(0, -0.28, 0);
    handR.name = 'handR';
    armRPivot.add(handR);

    // ===== BOYUN =====
    var neckGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.06, 6);
    var neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 0, 0);
    neck.name = 'neck';
    headPivot.add(neck);

    // ===== KAFA =====
    var headGeo = new THREE.SphereGeometry(0.22, 10, 10);
    var head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.06, 0);
    head.castShadow = true;
    head.name = 'head';
    headPivot.add(head);

    // ===== SAC =====
    var hairGeo = new THREE.SphereGeometry(0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2.5);
    var hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.14, 0.03);
    hair.name = 'hair';
    headPivot.add(hair);

    // ===== GOZLER =====
    var eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
    var eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 0.08, 0.18);
    eyeL.name = 'eyeL';
    headPivot.add(eyeL);

    var eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 0.08, 0.18);
    eyeR.name = 'eyeR';
    headPivot.add(eyeR);

    // ===== AGIZ =====
    // var mouthGeo = new THREE.BoxGeometry(0.06, 0.012, 0.02);
    // var mouthMat = new THREE.MeshStandardMaterial({ color: 0x884444 });
    // var mouth = new THREE.Mesh(mouthGeo, mouthMat);
    // mouth.position.set(0, 0.01, 0.2);
    // mouth.name = 'mouth';
    // headPivot.add(mouth);

    // ===== KULAKLIK =====
    var headsetMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.5, metalness: 0.4 });
    var hsGeo = new THREE.TorusGeometry(0.08, 0.015, 4, 8, Math.PI / 2);
    var headset = new THREE.Mesh(hsGeo, headsetMat);
    headset.position.set(0, 0.08, -0.15);
    headset.rotation.y = Math.PI;
    headset.name = 'headset';
    headPivot.add(headset);

    // ===== SILAH SLOT (sag el altinda) =====
    var weaponSlot = new THREE.Object3D();
    weaponSlot.name = 'weapon_slot';
    weaponSlot.position.set(0, -0.32, 0.12);
    armRPivot.add(weaponSlot);

    group.userData.bodyMat = bodyMat;
    group.userData.headMat = skinMat;

    return group;
  },

  // ===== ANIMASYON TANIMLARI =====
  animations: {
    idle: {
      duration: 1.4,
      loop: true,
      tracks: [
        { pivot: 'armL', prop: 'rotation.x', keys: [0.1, 0.15, 0.1] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.08, -0.13, -0.08] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0, 0.01, 0] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0, -0.01, 0] }
      ]
    },
    run: {
      duration: 0.45,
      loop: true,
      tracks: [
        { pivot: 'armL', prop: 'rotation.x', keys: [0.1, -0.5, 0.1] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.08, 0.5, -0.08] },
        { pivot: 'legL', prop: 'rotation.x', keys: [0, 0.5, 0] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0, -0.5, 0] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0, 0.02, 0] }
      ]
    },
    die: {
      duration: 0.8,
      loop: false,
      tracks: [
        { pivot: 'hip', prop: 'position.z', keys: [0, -0.35] },
        { pivot: 'hip', prop: 'position.y', keys: [0.28, 0.32, 0.04] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0, -0.85] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0, 0.35] },
        { pivot: 'head', prop: 'rotation.x', keys: [0, 0.5] },
        { pivot: 'legL', prop: 'rotation.x', keys: [0, 0.35] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0, -0.35] },
        { pivot: 'armL', prop: 'rotation.x', keys: [0.1, -0.85] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.08, -0.85] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0, 0.2] },
        { pivot: 'armR', prop: 'rotation.z', keys: [0, -0.2] }
      ]
    }
  }
});
