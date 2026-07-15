PluginRegistry.register({
  id: 'model_logo',
  name: 'Logo Modeli',
  type: 'model',
  version: '3.0',
  description: '3D logo — ince yuvarlak uzerinde zombi kafasi',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    // Malzemeler
    var baseMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a, metalness: 0.5, roughness: 0.6
    });
    var skullMat = new THREE.MeshStandardMaterial({
      color: 0x6a6a6a, roughness: 0.7, metalness: 0.2
    });
    var skullDarkMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a, roughness: 0.8, metalness: 0.1
    });
    var socketMat = new THREE.MeshStandardMaterial({
      color: 0x050505, roughness: 1, metalness: 0
    });
    var eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff2200, emissive: 0xff4400, emissiveIntensity: 0.8
    });
    var toothMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, roughness: 0.8, metalness: 0
    });
    var woundMat = new THREE.MeshStandardMaterial({
      color: 0x2a0a0a, roughness: 0.9, metalness: 0
    });

    // === TABAN (ince yuvarlak) ===
    var disc = new THREE.Mesh(new THREE.CircleGeometry(0.75, 36), baseMat);
    disc.position.z = -0.15;
    disc.name = 'disc';
    group.add(disc);

    // === ZOMBI KAFATASI ===
    var skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), skullMat);
    skull.position.set(0, 0.02, 0.15);
    skull.scale.set(0.95, 0.85, 0.7);
    skull.name = 'skull';
    group.add(skull);

    var jawBase = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), skullDarkMat);
    jawBase.position.set(0, -0.15, 0.15);
    jawBase.scale.set(0.9, 0.5, 0.6);
    jawBase.name = 'jawBase';
    group.add(jawBase);

    var socketGeo = new THREE.SphereGeometry(0.12, 8, 8);
    var socketL = new THREE.Mesh(socketGeo, socketMat);
    socketL.position.set(-0.16, 0.1, 0.6);
    socketL.scale.set(0.9, 0.8, 0.5);
    socketL.name = 'socketL';
    group.add(socketL);

    var socketR = new THREE.Mesh(socketGeo, socketMat);
    socketR.position.set(0.16, 0.1, 0.6);
    socketR.scale.set(0.9, 0.8, 0.5);
    socketR.name = 'socketR';
    group.add(socketR);

    var eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
    var eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.16, 0.1, 0.64);
    eyeL.name = 'eyeL';
    group.add(eyeL);

    var eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.16, 0.1, 0.64);
    eyeR.name = 'eyeR';
    group.add(eyeR);

    var nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.03), socketMat);
    nose.position.set(0, -0.02, 0.62);
    nose.name = 'nose';
    group.add(nose);

    for (var i = 0; i < 4; i++) {
      var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.02), toothMat);
      tooth.position.set(-0.09 + i * 0.06, -0.15, 0.62);
      tooth.name = 'tooth_' + i;
      group.add(tooth);
    }

    for (var i = 0; i < 2; i++) {
      var t2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.02), toothMat);
      t2.position.set(-0.04 + i * 0.08, -0.25, 0.58);
      t2.name = 'tooth_bot_' + i;
      group.add(t2);
    }

    var crackMat = new THREE.MeshStandardMaterial({
      color: 0x554444, roughness: 0.9, metalness: 0
    });
    var crack = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), crackMat);
    crack.position.set(0.12, 0.3, 0.55);
    crack.rotation.z = 0.4;
    crack.name = 'crack';
    group.add(crack);

    var wound = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), woundMat);
    wound.position.set(0.2, 0.0, 0.55);
    wound.scale.set(0.8, 0.6, 0.3);
    wound.name = 'wound';
    group.add(wound);

    return group;
  }
});
