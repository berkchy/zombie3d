PluginRegistry.register({
  id: 'model_zombie',
  name: 'Zombi',
  type: 'model',
  version: '1.1',
  description: 'Detayli zombi modeli — kambur, yarali, isil gozlu',
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

    // Bacaklar (hafif carik)
    var legGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.28, 5);
    var legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.13, 0.14, -0.02);
    legL.castShadow = true;
    legL.name = 'legL';
    group.add(legL);

    var legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.13, 0.14, 0.02);
    legR.rotation.z = 0.05;
    legR.castShadow = true;
    legR.name = 'legR';
    group.add(legR);

    // Botlar (yirtik)
    var bootGeo = new THREE.BoxGeometry(0.11, 0.06, 0.16);
    var bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(-0.13, 0.03, -0.02);
    bootL.name = 'bootL';
    group.add(bootL);

    var bootR = new THREE.Mesh(bootGeo, bootMat);
    bootR.position.set(0.13, 0.03, 0.02);
    bootR.name = 'bootR';
    group.add(bootR);

    // Govde (kambur, one egik)
    var torsoGeo = new THREE.CylinderGeometry(0.32, 0.26, 0.35, 6);
    var torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.set(0, 0.42, 0.04);
    torso.rotation.x = 0.15;
    torso.castShadow = true;
    torso.name = 'torso';
    group.add(torso);

    // Yirtik gomlek detayi
    var tearGeo = new THREE.BoxGeometry(0.15, 0.08, 0.005);
    var tearMat = new THREE.MeshStandardMaterial({ color: 0x5a5a4a, roughness: 0.9 });
    var tear = new THREE.Mesh(tearGeo, tearMat);
    tear.position.set(0.1, 0.45, 0.28);
    tear.name = 'shirt_tear';
    group.add(tear);

    // Yara - goguste
    var woundGeo = new THREE.SphereGeometry(0.05, 4, 4);
    var wound = new THREE.Mesh(woundGeo, woundMat);
    wound.position.set(-0.08, 0.48, 0.32);
    wound.scale.set(1, 0.4, 0.3);
    wound.name = 'wound_chest';
    group.add(wound);

    // Kan lekesi
    var bloodGeo = new THREE.CircleGeometry(0.06, 4);
    var blood = new THREE.Mesh(bloodGeo, bloodMat);
    blood.position.set(-0.08, 0.47, 0.34);
    blood.rotation.x = -Math.PI / 2;
    blood.name = 'blood_chest';
    group.add(blood);

    // Omuzlar
    var shGeo = new THREE.SphereGeometry(0.08, 5, 5);
    var shL = new THREE.Mesh(shGeo, shirtMat);
    shL.position.set(-0.33, 0.58, 0.04);
    shL.name = 'shoulderL';
    group.add(shL);

    var shR = new THREE.Mesh(shGeo, shirtMat);
    shR.position.set(0.33, 0.58, 0.04);
    shR.name = 'shoulderR';
    group.add(shR);

    // Sol kol (sarkik, dogal)
    var armGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.26, 5);
    var armL = new THREE.Mesh(armGeo, shirtMat);
    armL.position.set(-0.33, 0.42, 0.04);
    armL.rotation.z = 0.1;
    armL.castShadow = true;
    armL.name = 'armL';
    group.add(armL);

    // Sol el
    var handL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), darkSkinMat);
    handL.position.set(-0.35, 0.28, 0.04);
    handL.name = 'handL';
    group.add(handL);

    // Sag kol (uzanir gibi, one dogru)
    var armR = new THREE.Mesh(armGeo, shirtMat);
    armR.position.set(0.33, 0.48, 0.12);
    armR.rotation.z = -0.25;
    armR.rotation.x = -0.4;
    armR.castShadow = true;
    armR.name = 'armR';
    group.add(armR);

    // Sag el (acik, kavrama pozisyonu)
    var handR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 4, 4), darkSkinMat);
    handR.position.set(0.45, 0.42, 0.28);
    handR.name = 'handR';
    group.add(handR);

    // Parmaklar (sag el)
    var fingerMat = darkSkinMat;
    for (var fi = 0; fi < 3; fi++) {
      var fg = new THREE.BoxGeometry(0.012, 0.012, 0.025);
      var finger = new THREE.Mesh(fg, fingerMat);
      finger.position.set(0.45 + (fi - 1) * 0.025, 0.40, 0.31);
      finger.name = 'fingerR_' + fi;
      group.add(finger);
    }

    // Boyun (ince, zombi)
    var neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.04, 5);
    var neck = new THREE.Mesh(neckGeo, darkSkinMat);
    neck.position.set(0, 0.68, 0.02);
    neck.name = 'neck';
    group.add(neck);

    // Kafa (hafif one egik, uzun)
    var headGeo = new THREE.SphereGeometry(0.2, 7, 7);
    var head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.77, -0.02);
    head.scale.set(1, 1.15, 0.9);
    head.castShadow = true;
    head.name = 'head';
    group.add(head);

    // Alt cene (sarkik)
    var jawGeo = new THREE.SphereGeometry(0.14, 5, 4, 0, Math.PI * 2, Math.PI / 3, Math.PI / 2);
    var jaw = new THREE.Mesh(jawGeo, darkSkinMat);
    jaw.position.set(0, 0.72, 0.08);
    jaw.scale.set(1, 0.7, 0.8);
    jaw.name = 'jaw';
    group.add(jaw);

    // Gozler (isil kirmizi, buyuk)
    var eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    var eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 0.79, 0.16);
    eyeL.name = 'eyeL';
    group.add(eyeL);

    var eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 0.79, 0.16);
    eyeR.name = 'eyeR';
    group.add(eyeR);

    // Goz cukurlari (koyu halka)
    var socketMat = new THREE.MeshStandardMaterial({ color: 0x2a3a1a, roughness: 0.9 });
    var socketGeo = new THREE.SphereGeometry(0.055, 5, 5);
    var socketL = new THREE.Mesh(socketGeo, socketMat);
    socketL.position.set(-0.08, 0.79, 0.17);
    socketL.scale.set(1, 0.6, 0.5);
    socketL.name = 'socketL';
    group.add(socketL);

    var socketR = new THREE.Mesh(socketGeo, socketMat);
    socketR.position.set(0.08, 0.79, 0.17);
    socketR.scale.set(1, 0.6, 0.5);
    socketR.name = 'socketR';
    group.add(socketR);

    // Disler (sari, bozuk)
    for (var ti = 0; ti < 4; ti++) {
      var toothGeo = new THREE.BoxGeometry(0.02, 0.025, 0.01);
      var tooth = new THREE.Mesh(toothGeo, toothMat);
      tooth.position.set((ti - 1.5) * 0.025, 0.72, 0.18);
      tooth.rotation.z = (ti - 1.5) * 0.1;
      tooth.name = 'tooth_top_' + ti;
      group.add(tooth);
    }

    for (var bi = 0; bi < 3; bi++) {
      var t2 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, 0.01), toothMat);
      t2.position.set((bi - 1) * 0.025, 0.69, 0.17);
      t2.name = 'tooth_bot_' + bi;
      group.add(t2);
    }

    // Sag kolda yara
    var wound2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), woundMat);
    wound2.position.set(0.36, 0.48, 0.14);
    wound2.scale.set(0.5, 1, 0.5);
    wound2.name = 'wound_arm';
    group.add(wound2);

    // Kafada yarik
    var gashGeo = new THREE.BoxGeometry(0.06, 0.01, 0.02);
    var gash = new THREE.Mesh(gashGeo, woundMat);
    gash.position.set(0.05, 0.85, 0.1);
    gash.rotation.z = 0.3;
    gash.name = 'head_gash';
    group.add(gash);

    // Belde kemer (yirtik)
    var beltMatZ = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });
    var beltGeoZ = new THREE.TorusGeometry(0.26, 0.025, 3, 8);
    var beltZ = new THREE.Mesh(beltGeoZ, beltMatZ);
    beltZ.position.set(0, 0.26, 0.04);
    beltZ.rotation.x = Math.PI / 2;
    beltZ.name = 'belt';
    group.add(beltZ);

    return group;
  }
});
