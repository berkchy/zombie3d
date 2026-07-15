PluginRegistry.register({
  id: 'model_player',
  name: 'Oyuncu',
  type: 'model',
  version: '1.1',
  description: 'Detayli oyuncu karakter modeli',
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

    // Bacaklar
    var legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.3, 6);
    var legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.12, 0.15, 0);
    legL.castShadow = true;
    legL.name = 'legL';
    group.add(legL);

    var legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.12, 0.15, 0);
    legR.castShadow = true;
    legR.name = 'legR';
    group.add(legR);

    // Botlar
    var bootGeo = new THREE.BoxGeometry(0.1, 0.06, 0.16);
    var bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(-0.12, 0.03, 0.02);
    bootL.castShadow = true;
    bootL.name = 'bootL';
    group.add(bootL);

    var bootR = new THREE.Mesh(bootGeo, bootMat);
    bootR.position.set(0.12, 0.03, 0.02);
    bootR.castShadow = true;
    bootR.name = 'bootR';
    group.add(bootR);

    // Govde
    var torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.38, 8);
    var torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.set(0, 0.44, 0);
    torso.castShadow = true;
    torso.name = 'torso';
    group.add(torso);

    // Gogs zirhi (detay)
    var plateGeo = new THREE.BoxGeometry(0.28, 0.16, 0.06);
    var plateMat = new THREE.MeshStandardMaterial({ color: 0x3a9fc7, roughness: 0.3, metalness: 0.4 });
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.5, 0.28);
    plate.name = 'chest_plate';
    group.add(plate);

    // Kemer
    var beltGeo = new THREE.TorusGeometry(0.28, 0.03, 4, 12);
    var belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.28, 0);
    belt.rotation.x = Math.PI / 2;
    belt.name = 'belt';
    group.add(belt);

    // Kemer tokasi
    var buckleGeo = new THREE.BoxGeometry(0.04, 0.04, 0.02);
    var buckle = new THREE.Mesh(buckleGeo, metalMat);
    buckle.position.set(0, 0.28, 0.27);
    buckle.name = 'buckle';
    group.add(buckle);

    // Omuzlar
    var shGeo = new THREE.SphereGeometry(0.08, 6, 6);
    var shMat = new THREE.MeshStandardMaterial({ color: 0x3a9fc7, roughness: 0.3, metalness: 0.2 });
    var shL = new THREE.Mesh(shGeo, shMat);
    shL.position.set(-0.32, 0.6, 0);
    shL.name = 'shoulderL';
    group.add(shL);

    var shR = new THREE.Mesh(shGeo, shMat);
    shR.position.set(0.32, 0.6, 0);
    shR.name = 'shoulderR';
    group.add(shR);

    // Kollar
    var armGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.28, 6);
    var armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-0.32, 0.42, 0);
    armL.rotation.z = 0.08;
    armL.castShadow = true;
    armL.name = 'armL';
    group.add(armL);

    var armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(0.32, 0.42, 0);
    armR.rotation.z = -0.08;
    armR.castShadow = true;
    armR.name = 'armR';
    group.add(armR);

    // Eller
    var handGeo = new THREE.SphereGeometry(0.04, 4, 4);
    var handL = new THREE.Mesh(handGeo, skinMat);
    handL.position.set(-0.34, 0.27, 0);
    handL.name = 'handL';
    group.add(handL);

    var handR = new THREE.Mesh(handGeo, skinMat);
    handR.position.set(0.34, 0.27, 0);
    handR.name = 'handR';
    group.add(handR);

    // Boyun
    var neckGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.06, 6);
    var neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 0.72, 0);
    neck.name = 'neck';
    group.add(neck);

    // Kafa
    var headGeo = new THREE.SphereGeometry(0.22, 10, 10);
    var head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.82, 0);
    head.castShadow = true;
    head.name = 'head';
    group.add(head);

    // Sac
    var hairGeo = new THREE.SphereGeometry(0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2.5);
    var hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.9, 0.03);
    hair.name = 'hair';
    group.add(hair);

    // Gozler
    var eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
    var eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 0.84, 0.18);
    eyeL.name = 'eyeL';
    group.add(eyeL);

    var eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 0.84, 0.18);
    eyeR.name = 'eyeR';
    group.add(eyeR);

    // Agiz
    var mouthGeo = new THREE.BoxGeometry(0.06, 0.012, 0.02);
    var mouthMat = new THREE.MeshStandardMaterial({ color: 0x884444 });
    var mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 0.77, 0.2);
    mouth.name = 'mouth';
    group.add(mouth);

    // Kulaklik (tactical headset)
    var headsetMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.5, metalness: 0.4 });
    var hsGeo = new THREE.TorusGeometry(0.08, 0.015, 4, 8, Math.PI / 2);
    var headset = new THREE.Mesh(hsGeo, headsetMat);
    headset.position.set(0, 0.84, -0.15);
    headset.rotation.y = Math.PI;
    headset.name = 'headset';
    group.add(headset);

    // Silah baglanti noktasi — sag el
    var weaponSlot = new THREE.Object3D();
    weaponSlot.name = 'weapon_slot';
    weaponSlot.position.set(0.34, 0.30, 0.15);
    group.add(weaponSlot);

    group.userData.bodyMat = bodyMat;
    group.userData.headMat = skinMat;

    return group;
  }
});
