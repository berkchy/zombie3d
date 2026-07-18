var plugin = include('registry');

plugin.register({
  id: 'model_boss',
  name: 'Boss Zombi',
  type: 'model',
  version: '1.0',
  description: 'Boss zombi — iri, zırhlı, korkunç',

  createModel() {
    var group = new THREE.Group();

    var skinMat = new THREE.MeshStandardMaterial({ color: 0x2a0a0a, roughness: 0.9 });
    var darkSkinMat = new THREE.MeshStandardMaterial({ color: 0x1a0505, roughness: 0.95 });
    var armorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.6 });
    var armorTrimMat = new THREE.MeshStandardMaterial({ color: 0x3a2a0a, roughness: 0.6, metalness: 0.7 });
    var pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a0a0a, roughness: 0.85 });
    var bootMat = new THREE.MeshStandardMaterial({ color: 0x0a0505, roughness: 0.9 });
    var eyeMat = new THREE.MeshStandardMaterial({ color: 0xff1100, emissive: 0xff0000, emissiveIntensity: 1.5, roughness: 0.1 });
    var glowMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 0.8, roughness: 0.2, transparent: true, opacity: 0.5 });
    var toothMat = new THREE.MeshStandardMaterial({ color: 0x886633, roughness: 0.9 });
    var crownMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.8, metalness: 0.5 });
    var bloodMat = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.9 });
    var woundMat = new THREE.MeshStandardMaterial({ color: 0x551111, roughness: 0.8 });
    var boneMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
    var chainMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.8 });

    var s = 1.6;

    // ===== ISKELET =====
    var hip = new THREE.Object3D();
    hip.name = 'hip';
    hip.position.set(0, 0.35 * s, 0);
    group.add(hip);

    var torsoPivot = new THREE.Object3D();
    torsoPivot.name = 'torso';
    torsoPivot.position.set(0, 0.2 * s, 0);
    hip.add(torsoPivot);

    var headPivot = new THREE.Object3D();
    headPivot.name = 'head';
    headPivot.position.set(0, 0.32 * s, -0.02 * s);
    torsoPivot.add(headPivot);

    var legL = new THREE.Object3D(); legL.name = 'legL'; legL.position.set(-0.2 * s, -0.15 * s, 0); hip.add(legL);
    var legR = new THREE.Object3D(); legR.name = 'legR'; legR.position.set(0.2 * s, -0.15 * s, 0); hip.add(legR);

    var shL = new THREE.Object3D(); shL.name = 'shoulderL'; shL.position.set(-0.34 * s, 0.2 * s, 0); torsoPivot.add(shL);
    var shR = new THREE.Object3D(); shR.name = 'shoulderR'; shR.position.set(0.34 * s, 0.2 * s, 0); torsoPivot.add(shR);
    var armL = new THREE.Object3D(); armL.name = 'armL'; armL.position.set(0, -0.06 * s, 0); shL.add(armL);
    var armR = new THREE.Object3D(); armR.name = 'armR'; armR.position.set(0, -0.06 * s, 0); shR.add(armR);

    // ===== GOVDE =====
    var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * s, 0.28 * s, 0.42 * s, 7), armorMat);
    torso.position.set(0, 0, 0);
    torso.castShadow = true;
    torso.name = 'torso';
    torsoPivot.add(torso);

    // Göğüs zırhı (çift katman)
    var chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.34 * s, 0.18 * s, 0.025), armorTrimMat);
    chestPlate.position.set(0, 0.1 * s, 0.24 * s);
    chestPlate.name = 'chestPlate';
    torsoPivot.add(chestPlate);

    var chestPlate2 = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.1 * s, 0.02), armorTrimMat);
    chestPlate2.position.set(0, 0.0, 0.26 * s);
    chestPlate2.name = 'chestPlate2';
    torsoPivot.add(chestPlate2);

    // Göğüste zincirler
    for (var ch = -1; ch <= 1; ch += 2) {
      var chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.1 * s, 4), chainMat);
      chain.position.set(ch * 0.14 * s, -0.02 * s, 0.26 * s);
      chain.rotation.z = ch * 0.2;
      chain.rotation.x = 0.1;
      chain.name = 'chestChain_' + ch;
      torsoPivot.add(chain);

      var chainEnd = new THREE.Mesh(new THREE.SphereGeometry(0.02 * s, 4, 4), chainMat);
      chainEnd.position.set(ch * 0.18 * s, -0.08 * s, 0.26 * s);
      chainEnd.name = 'chainEnd_' + ch;
      torsoPivot.add(chainEnd);
    }

    // Açık yara (göğüste et/kemik)
    var chestWound = new THREE.Mesh(new THREE.SphereGeometry(0.08 * s, 5, 5), woundMat);
    chestWound.position.set(-0.06 * s, 0.04 * s, 0.26 * s);
    chestWound.scale.set(1, 0.5, 0.3);
    chestWound.name = 'chestWound';
    torsoPivot.add(chestWound);

    var ribBone = new THREE.Mesh(new THREE.CylinderGeometry(0.01 * s, 0.015 * s, 0.06 * s, 4), boneMat);
    ribBone.position.set(-0.06 * s, 0.06 * s, 0.27 * s);
    ribBone.rotation.x = 0.4;
    ribBone.name = 'ribBone';
    torsoPivot.add(ribBone);

    // Pauldronlar (büyük, çivili)
    for (var p = -1; p <= 1; p += 2) {
      for (var pl = 0; pl < 2; pl++) {
        var pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.1 * s, 5, 5), armorMat);
        pauldron.position.set(p * 0.3 * s, 0.18 * s - pl * 0.04, 0.02 + pl * 0.04);
        pauldron.scale.set(1.5, 0.5 + pl * 0.1, 1.2 - pl * 0.1);
        pauldron.name = 'pauldron_' + p + '_' + pl;
        torsoPivot.add(pauldron);
      }

      for (var sp = 0; sp < 4; sp++) {
        var spike = new THREE.Mesh(new THREE.ConeGeometry(0.03 * s, 0.14 * s, 4), armorTrimMat);
        spike.position.set(p * 0.32 * s, 0.18 * s - sp * 0.025, 0.1 + sp * 0.02);
        spike.rotation.x = -0.6 + sp * 0.1;
        spike.rotation.z = p * 0.25;
        spike.name = 'spike_' + p + '_' + sp;
        torsoPivot.add(spike);
      }
    }

    // Bel zırhı + kafatası
    var belt = new THREE.Mesh(new THREE.TorusGeometry(0.26 * s, 0.04 * s, 4, 10), armorTrimMat);
    belt.position.set(0, -0.18 * s, 0);
    belt.rotation.x = Math.PI / 2;
    belt.name = 'belt';
    torsoPivot.add(belt);

    var skullBelt = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 5, 5), boneMat);
    skullBelt.position.set(0, -0.18 * s, 0.22 * s);
    skullBelt.scale.set(0.8, 0.7, 0.5);
    skullBelt.name = 'skullBelt';
    torsoPivot.add(skullBelt);

    // ===== BACAKLAR =====
    var upperLeg = new THREE.CylinderGeometry(0.15 * s, 0.13 * s, 0.22 * s, 5);
    var uL = new THREE.Mesh(upperLeg, pantsMat);
    uL.position.set(0, 0.08 * s, 0); uL.castShadow = true; uL.name = 'upperLegL_mesh'; legL.add(uL);
    var uR = new THREE.Mesh(upperLeg, pantsMat);
    uR.position.set(0, 0.08 * s, 0); uR.castShadow = true; uR.name = 'upperLegR_mesh'; legR.add(uR);

    // Diz zırhı
    for (var d = -1; d <= 1; d += 2) {
      var kneeSpike = new THREE.Mesh(new THREE.ConeGeometry(0.025 * s, 0.08 * s, 4), armorTrimMat);
      kneeSpike.position.set(d * -0.04, -0.04 * s, 0.1 * s);
      kneeSpike.rotation.x = 0.5;
      kneeSpike.name = 'kneeSpike' + (d < 0 ? 'L' : 'R');
      (d < 0 ? legL : legR).add(kneeSpike);
    }

    var kneeL = new THREE.Object3D(); kneeL.name = 'kneeL'; kneeL.position.set(0, -0.04 * s, 0); legL.add(kneeL);
    var kneeR = new THREE.Object3D(); kneeR.name = 'kneeR'; kneeR.position.set(0, -0.04 * s, 0); legR.add(kneeR);

    var lowerLeg = new THREE.CylinderGeometry(0.13 * s, 0.11 * s, 0.18 * s, 5);
    var lL = new THREE.Mesh(lowerLeg, pantsMat);
    lL.position.set(0, -0.09 * s, 0); lL.castShadow = true; lL.name = 'lowerLegL_mesh'; kneeL.add(lL);
    var lR = new THREE.Mesh(lowerLeg, pantsMat);
    lR.position.set(0, -0.09 * s, 0); lR.castShadow = true; lR.name = 'lowerLegR_mesh'; kneeR.add(lR);

    // Botlar
    var boot = new THREE.BoxGeometry(0.18 * s, 0.08 * s, 0.26 * s);
    var bL = new THREE.Mesh(boot, bootMat);
    bL.position.set(0, -0.13 * s, -0.02 * s); bL.name = 'bootL'; kneeL.add(bL);
    var bR = new THREE.Mesh(boot, bootMat);
    bR.position.set(0, -0.13 * s, 0.02 * s); bR.name = 'bootR'; kneeR.add(bR);

    // ===== KOLLAR =====
    var arm = new THREE.CylinderGeometry(0.1 * s, 0.12 * s, 0.34 * s, 6);
    var aL = new THREE.Mesh(arm, armorMat);
    aL.position.set(0, -0.17 * s, 0); aL.castShadow = true; aL.name = 'armL_mesh'; armL.add(aL);
    var aR = new THREE.Mesh(arm, armorMat);
    aR.position.set(0, -0.17 * s, 0); aR.castShadow = true; aR.name = 'armR_mesh'; armR.add(aR);

    // Dirsek sivri uçları
    for (var el = -1; el <= 1; el += 2) {
      var elbow = new THREE.Mesh(new THREE.ConeGeometry(0.025 * s, 0.1 * s, 4), armorTrimMat);
      elbow.position.set(el * 0.06, -0.12 * s, 0.08 * s);
      elbow.rotation.z = el * 0.4;
      elbow.rotation.x = -0.3;
      elbow.name = 'elbowSpike' + (el < 0 ? 'L' : 'R');
      (el < 0 ? armL : armR).add(elbow);
    }

    // Eller (yumruk)
    var fist = new THREE.SphereGeometry(0.09 * s, 5, 5);
    var fL = new THREE.Mesh(fist, darkSkinMat);
    fL.position.set(0, -0.36 * s, 0); fL.scale.set(1.3, 1, 1.1); fL.name = 'fistL'; armL.add(fL);
    var fR = new THREE.Mesh(fist, darkSkinMat);
    fR.position.set(0, -0.36 * s, 0); fR.scale.set(1.3, 1, 1.1); fR.name = 'fistR'; armR.add(fR);

    // ===== BOYUN =====
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.17 * s, 0.06 * s, 6), darkSkinMat);
    neck.position.set(0, 0, 0);
    neck.name = 'neck';
    headPivot.add(neck);

    // Boyun zinciri
    var neckChain = new THREE.Mesh(new THREE.TorusGeometry(0.16 * s, 0.015 * s, 4, 8), chainMat);
    neckChain.position.set(0, 0.02 * s, 0);
    neckChain.rotation.x = Math.PI / 2;
    neckChain.name = 'neckChain';
    headPivot.add(neckChain);

    // ===== KAFA =====
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 7, 7), skinMat);
    head.position.set(0, 0.06 * s, 0);
    head.scale.set(1, 1.2, 0.9);
    head.castShadow = true;
    head.name = 'head';
    headPivot.add(head);

    // Çene zırhı
    var jawGuard = new THREE.Mesh(new THREE.BoxGeometry(0.18 * s, 0.04 * s, 0.14 * s), armorMat);
    jawGuard.position.set(0, -0.02 * s, 0.18 * s);
    jawGuard.name = 'jawGuard';
    headPivot.add(jawGuard);

    // Çene sivri uçları
    for (var j = -1; j <= 1; j += 2) {
      var jSpike = new THREE.Mesh(new THREE.ConeGeometry(0.02 * s, 0.06 * s, 4), armorTrimMat);
      jSpike.position.set(j * 0.06 * s, -0.04 * s, 0.24 * s);
      jSpike.rotation.x = 0.3;
      jSpike.name = 'jawSpike_' + j;
      headPivot.add(jSpike);
    }

    // ===== TAC/BOYNUZ =====
    for (var c = -1; c <= 1; c += 2) {
      var horn = new THREE.Mesh(new THREE.ConeGeometry(0.045 * s, 0.3 * s, 5), crownMat);
      horn.position.set(c * 0.13 * s, 0.26 * s, -0.04 * s);
      horn.rotation.x = -0.4 + c * 0.15;
      horn.rotation.z = c * 0.45;
      horn.name = 'crownHorn_' + c;
      headPivot.add(horn);

      var horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.03 * s, 0.2 * s, 5), crownMat);
      horn2.position.set(c * 0.2 * s, 0.22 * s, -0.06 * s);
      horn2.rotation.x = -0.25;
      horn2.rotation.z = c * 0.65;
      horn2.name = 'crownHorn2_' + c;
      headPivot.add(horn2);
    }
    // Taç tabanı
    var crownBase = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.025 * s, 0.08 * s), crownMat);
    crownBase.position.set(0, 0.2 * s, 0.02 * s);
    crownBase.name = 'crownBase';
    headPivot.add(crownBase);

    // Alın boynuzu
    var midHorn = new THREE.Mesh(new THREE.ConeGeometry(0.06 * s, 0.22 * s, 5), crownMat);
    midHorn.position.set(0, 0.24 * s, 0.08 * s);
    midHorn.rotation.x = 0.4;
    midHorn.name = 'midHorn';
    headPivot.add(midHorn);

    // ===== GÖZLER =====
    var eyeGeo = new THREE.SphereGeometry(0.06 * s, 6, 6);
    var glowGeo = new THREE.SphereGeometry(0.1 * s, 6, 6);

    for (var e = -1; e <= 1; e += 2) {
      var glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(e * 0.11 * s, 0.03 * s, 0.2 * s);
      glow.name = 'eyeGlow_' + e;
      headPivot.add(glow);

      var eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(e * 0.11 * s, 0.03 * s, 0.24 * s);
      eye.name = 'eye_' + e;
      headPivot.add(eye);

      var socket = new THREE.Mesh(new THREE.SphereGeometry(0.09 * s, 5, 5), new THREE.MeshStandardMaterial({ color: 0x050000, roughness: 0.9 }));
      socket.position.set(e * 0.11 * s, 0.03 * s, 0.15 * s);
      socket.scale.set(1, 0.5, 0.35);
      socket.name = 'socket_' + e;
      headPivot.add(socket);
    }

    // ===== DİŞLER =====
    for (var t = 0; t < 5; t++) {
      var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.025 * s, 0.04 * s, 0.01), toothMat);
      tooth.position.set((t - 2) * 0.035 * s, -0.03 * s, 0.24 * s);
      tooth.rotation.z = (t - 2) * 0.08;
      tooth.name = 'tooth_top_' + t;
      headPivot.add(tooth);
    }

    for (var b2 = 0; b2 < 4; b2++) {
      var t2 = new THREE.Mesh(new THREE.BoxGeometry(0.02 * s, 0.025 * s, 0.01), toothMat);
      t2.position.set((b2 - 1.5) * 0.03 * s, -0.07 * s, 0.22 * s);
      t2.name = 'tooth_bot_' + b2;
      headPivot.add(t2);
    }

    // ===== YARA İZLERİ =====
    var scarMat = new THREE.MeshStandardMaterial({ color: 0x551111, roughness: 0.8 });

    var faceScar1 = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.01 * s, 0.02), scarMat);
    faceScar1.position.set(0.08 * s, 0.12 * s, 0.22 * s);
    faceScar1.rotation.z = 0.5;
    faceScar1.name = 'faceScar1';
    headPivot.add(faceScar1);

    var faceScar2 = new THREE.Mesh(new THREE.BoxGeometry(0.06 * s, 0.01 * s, 0.02), scarMat);
    faceScar2.position.set(-0.07 * s, 0.08 * s, 0.22 * s);
    faceScar2.rotation.z = -0.3;
    faceScar2.name = 'faceScar2';
    headPivot.add(faceScar2);

    // Göz altı kan
    for (var bl = -1; bl <= 1; bl += 2) {
      var blood = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 4, 4), bloodMat);
      blood.position.set(bl * 0.11 * s, -0.02 * s, 0.22 * s);
      blood.scale.set(0.8, 0.3, 0.2);
      blood.name = 'eyeBlood_' + bl;
      headPivot.add(blood);
    }

    // Vücut yaraları
    for (var w = 0; w < 3; w++) {
      var wound = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s + Math.random() * 0.03, 4, 4), woundMat);
      wound.position.set(-0.08 + w * 0.08 * s, -0.04 * s, 0.26 * s);
      wound.scale.set(1, 0.3 + Math.random() * 0.2, 0.3);
      wound.name = 'bodyWound_' + w;
      torsoPivot.add(wound);
    }

    return group;
  },

  animations: {
    idle: {
      duration: 6,
      loop: true,
      tracks: [
        { pivot: 'head', prop: 'rotation.y', keys: [0, 0.15, -0.15, 0] },
        { pivot: 'head', prop: 'rotation.x', keys: [-0.05, -0.1, 0, -0.05] },
        { pivot: 'armL', prop: 'rotation.x', keys: [-0.1, -0.25, -0.15, -0.1] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.2, -0.35, -0.15, -0.2] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0.08, 0.12, 0.05, 0.08] },
        { pivot: 'armR', prop: 'rotation.z', keys: [-0.06, -0.1, -0.04, -0.06] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0.08, 0.12, 0.04, 0.08] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0.01, 0.05, -0.03, 0.01] }
      ]
    },
    walk: {
      duration: 1.8,
      loop: true,
      tracks: [
        { pivot: 'head', prop: 'rotation.y', keys: [0, -0.08, 0.08, 0] },
        { pivot: 'head', prop: 'rotation.x', keys: [-0.05, 0, -0.05, -0.05] },
        { pivot: 'armL', prop: 'rotation.x', keys: [-0.4, -0.1, -0.4, -0.4] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.1, -0.4, -0.1, -0.1] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0.15, 0.1, 0.15, 0.15] },
        { pivot: 'armR', prop: 'rotation.z', keys: [-0.12, -0.08, -0.12, -0.12] },
        { pivot: 'legL', prop: 'rotation.x', keys: [-0.4, 0.15, -0.4, -0.4] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0.15, -0.4, 0.15, 0.15] },
        { pivot: 'kneeL', prop: 'rotation.x', keys: [0.1, 0.35, 0.1, 0.1] },
        { pivot: 'kneeR', prop: 'rotation.x', keys: [0.35, 0.1, 0.35, 0.35] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0.15, 0, 0.15, 0.15] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0.05, -0.1, 0.05, 0.05] },
        { pivot: 'hip', prop: 'position.y', keys: [0.56, 0.5, 0.56, 0.56] }
      ]
    },
    attack: {
      duration: 1.2,
      loop: false,
      tracks: [
        { pivot: 'head', prop: 'rotation.x', keys: [-0.05, 0.2, -0.6, -0.3] },
        { pivot: 'head', prop: 'rotation.y', keys: [0, 0, 0, 0] },
        { pivot: 'armL', prop: 'rotation.x', keys: [-0.1, 0.8, -2.4, -0.8] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.2, 0.6, -2.4, -1.0] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0.08, 0.06, 0.04, 0.08] },
        { pivot: 'armR', prop: 'rotation.z', keys: [-0.06, -0.04, -0.04, -0.06] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0.01, -0.3, 0.5, 0.1] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0.08, 0.04, 0.12, 0.08] },
        { pivot: 'hip', prop: 'position.y', keys: [0.56, 0.52, 0.58, 0.56] }
      ]
    },
    roar: {
      duration: 3,
      loop: false,
      tracks: [
        { pivot: 'head', prop: 'rotation.x', keys: [-0.05, 0.3, -0.05, -0.05] },
        { pivot: 'head', prop: 'rotation.y', keys: [0, 0, 0, 0] },
        { pivot: 'armL', prop: 'rotation.x', keys: [-0.1, -0.8, -0.1, -0.1] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.2, -1.0, -0.2, -0.2] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0.08, 0.3, 0.08, 0.08] },
        { pivot: 'armR', prop: 'rotation.z', keys: [-0.06, -0.35, -0.06, -0.06] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0.01, -0.2, 0.01, 0.01] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0.08, 0.25, 0.08, 0.08] },
        { pivot: 'hip', prop: 'position.y', keys: [0.56, 0.6, 0.56, 0.56] }
      ]
    },
    die: {
      duration: 3.5,
      loop: false,
      tracks: [
        { pivot: 'head', prop: 'rotation.x', keys: [-0.05, 0.1, 0.5, 0.5] },
        { pivot: 'head', prop: 'rotation.y', keys: [0, 0.3, -0.5, 0.5] },
        { pivot: 'armL', prop: 'rotation.x', keys: [-0.1, 0.8, -0.3, -0.3] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.2, 0.6, -0.3, -0.3] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0.08, 0.3, 0.5, 0.5] },
        { pivot: 'armR', prop: 'rotation.z', keys: [-0.06, -0.25, -0.5, -0.5] },
        { pivot: 'legL', prop: 'rotation.x', keys: [0, 0.3, 0.3, 0.3] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0, -0.3, -0.3, -0.3] },
        { pivot: 'kneeL', prop: 'rotation.x', keys: [0, 0.4, 0.4, 0.4] },
        { pivot: 'kneeR', prop: 'rotation.x', keys: [0, 0.4, 0.4, 0.4] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0.01, -0.5, -1.5, -1.5] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0.08, 0.1, 0.2, 0.2] },
        { pivot: 'hip', prop: 'rotation.x', keys: [0.08, 0.3, 0.3, 0.3] },
        { pivot: 'hip', prop: 'position.y', keys: [0.56, 0.56, 0.05, 0.05] }
      ]
    }
  }
});
