var plugin = include('registry');

plugin.register({
  id: 'model_player',
  name: 'Oyuncu',
  type: 'model',
  version: '2.0',
  description: 'Profesyonel oyuncu modeli — taktik ekipmanli + dogal animasyonlar',
  enabled: true,
  thumbnailCam: [2.8, 1.4, 2.8],
  thumbnailOffset: [0, 0.05, 0],

  createModel() {
    var g = new THREE.Group();

    var tacticalMat = new THREE.MeshStandardMaterial({ color: 0x3a4a3a, roughness: 0.6, metalness: 0.1 });
    var darkTacticalMat = new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.7 });
    var armorMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.4, metalness: 0.5 });
    var pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    var skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
    var darkSkinMat = new THREE.MeshStandardMaterial({ color: 0xd4a882, roughness: 0.6 });
    var bootMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9 });
    var gloveMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.7 });
    var beltMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
    var eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    var hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7 });
    var pouchMat = new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.8 });
    var kneeMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.3 });
    var accentMat = new THREE.MeshStandardMaterial({ color: 0x6a7a5a, roughness: 0.5 });

    var s = 1.0;

    // ===== ISKELET =====
    var hip = new THREE.Object3D(); hip.name = 'hip'; hip.position.set(0, 0.32 * s, 0); g.add(hip);

    var torsoPivot = new THREE.Object3D(); torsoPivot.name = 'torso'; torsoPivot.position.set(0, 0.18 * s, 0); hip.add(torsoPivot);

    var headPivot = new THREE.Object3D(); headPivot.name = 'head'; headPivot.position.set(0, 0.32 * s, -0.01 * s); torsoPivot.add(headPivot);

    var legL = new THREE.Object3D(); legL.name = 'legL'; legL.position.set(-0.14 * s, -0.14 * s, 0); hip.add(legL);
    var legR = new THREE.Object3D(); legR.name = 'legR'; legR.position.set(0.14 * s, -0.14 * s, 0); hip.add(legR);

    var shoulderL = new THREE.Object3D(); shoulderL.name = 'shoulderL'; shoulderL.position.set(-0.26 * s, 0.18 * s, 0); torsoPivot.add(shoulderL);
    var shoulderR = new THREE.Object3D(); shoulderR.name = 'shoulderR'; shoulderR.position.set(0.26 * s, 0.18 * s, 0); torsoPivot.add(shoulderR);

    var armL = new THREE.Object3D(); armL.name = 'armL'; armL.position.set(0, -0.06 * s, 0); shoulderL.add(armL);
    var armR = new THREE.Object3D(); armR.name = 'armR'; armR.position.set(0, -0.06 * s, 0); shoulderR.add(armR);

    // ===== GOVDE (taktik yelek) =====
    var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21 * s, 0.18 * s, 0.40 * s, 10), tacticalMat);
    torso.position.set(0, 0, 0); torso.castShadow = true; torso.name = 'torso'; torsoPivot.add(torso);

    // Gogs zırh plakası
    var chest = new THREE.Mesh(new THREE.BoxGeometry(0.24 * s, 0.18 * s, 0.06 * s), armorMat);
    chest.position.set(0, 0.08 * s, 0.20 * s); chest.name = 'chest_plate'; torsoPivot.add(chest);

    // Yan plakalar
    for (var sp = -1; sp <= 1; sp += 2) {
      var sidePlate = new THREE.Mesh(new THREE.BoxGeometry(0.02 * s, 0.14 * s, 0.12 * s), armorMat);
      sidePlate.position.set(sp * 0.20 * s, 0.04 * s, 0.10 * s);
      sidePlate.name = 'sidePlate_' + sp; torsoPivot.add(sidePlate);
    }

    // Cep sıraları (göğüste)
    for (var p = -1; p <= 1; p += 2) {
      var pouch = new THREE.Mesh(new THREE.BoxGeometry(0.04 * s, 0.06 * s, 0.03 * s), pouchMat);
      pouch.position.set(p * 0.06 * s, 0.06 * s, 0.22 * s);
      pouch.name = 'pouch_' + p; torsoPivot.add(pouch);
    }

    // Omuz koruyucuları
    for (var sh = -1; sh <= 1; sh += 2) {
      var shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.10 * s, 0.06 * s, 0.14 * s), armorMat);
      shoulderPad.position.set(sh * 0.22 * s, 0.18 * s, 0.02 * s);
      shoulderPad.rotation.x = -0.15;
      shoulderPad.name = 'shoulderPad_' + sh; torsoPivot.add(shoulderPad);
    }

    // Kemer
    var belt = new THREE.Mesh(new THREE.TorusGeometry(0.19 * s, 0.025 * s, 4, 12), beltMat);
    belt.position.set(0, -0.18 * s, 0); belt.rotation.x = Math.PI / 2; belt.name = 'belt'; torsoPivot.add(belt);

    var buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05 * s, 0.04 * s, 0.025 * s), new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.3, metalness: 0.6 }));
    buckle.position.set(0, -0.18 * s, 0.16 * s); buckle.name = 'buckle'; torsoPivot.add(buckle);

    // Kemer malzemeleri (multiculum)
    for (var mc = -1; mc <= 1; mc += 2) {
      var molle = new THREE.Mesh(new THREE.BoxGeometry(0.015 * s, 0.02 * s, 0.03 * s), accentMat);
      molle.position.set(mc * 0.10 * s, -0.18 * s, 0.19 * s);
      molle.name = 'molle_' + mc; torsoPivot.add(molle);
    }

    // ===== BACAKLAR =====
    var upperLeg = new THREE.CylinderGeometry(0.10 * s, 0.08 * s, 0.18 * s, 8);
    var ulL = new THREE.Mesh(upperLeg, pantsMat); ulL.position.set(0, 0.04 * s, 0); ulL.castShadow = true; ulL.name = 'upperLegL_mesh'; legL.add(ulL);
    var ulR = new THREE.Mesh(upperLeg, pantsMat); ulR.position.set(0, 0.04 * s, 0); ulR.castShadow = true; ulR.name = 'upperLegR_mesh'; legR.add(ulR);

    var kneeL = new THREE.Object3D(); kneeL.name = 'kneeL'; kneeL.position.set(0, -0.05 * s, 0); legL.add(kneeL);
    var kneeR = new THREE.Object3D(); kneeR.name = 'kneeR'; kneeR.position.set(0, -0.05 * s, 0); legR.add(kneeR);

    // Dizlikler
    for (var k = -1; k <= 1; k += 2) {
      var kneepad = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 5, 5), kneeMat);
      kneepad.position.set(k * -0.03 * s, -0.02 * s, 0.07 * s);
      kneepad.scale.set(1, 0.5, 0.4);
      kneepad.name = 'kneepad' + (k < 0 ? 'L' : 'R');
      (k < 0 ? kneeL : kneeR).add(kneepad);
    }

    var lowerLeg = new THREE.CylinderGeometry(0.08 * s, 0.07 * s, 0.14 * s, 8);
    var llL = new THREE.Mesh(lowerLeg, pantsMat); llL.position.set(0, -0.07 * s, 0); llL.castShadow = true; llL.name = 'lowerLegL_mesh'; kneeL.add(llL);
    var llR = new THREE.Mesh(lowerLeg, pantsMat); llR.position.set(0, -0.07 * s, 0); llR.castShadow = true; llR.name = 'lowerLegR_mesh'; kneeR.add(llR);

    // Botlar
    var bootGeo = new THREE.BoxGeometry(0.12 * s, 0.07 * s, 0.20 * s);
    var bL = new THREE.Mesh(bootGeo, bootMat); bL.position.set(0, -0.11 * s, 0.02 * s); bL.name = 'bootL'; kneeL.add(bL);
    var bR = new THREE.Mesh(bootGeo, bootMat); bR.position.set(0, -0.11 * s, 0.02 * s); bR.name = 'bootR'; kneeR.add(bR);

    // Bot taban detayı
    for (var bt = -1; bt <= 1; bt += 2) {
      var sole = new THREE.Mesh(new THREE.BoxGeometry(0.10 * s, 0.015 * s, 0.18 * s), new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 1 }));
      sole.position.set(0, -0.12 * s, 0.02 * s);
      sole.name = 'sole' + (bt < 0 ? 'L' : 'R');
      (bt < 0 ? kneeL : kneeR).add(sole);
    }

    // ===== KOLLAR =====
    var armGeo = new THREE.CylinderGeometry(0.06 * s, 0.07 * s, 0.30 * s, 8);
    var aL = new THREE.Mesh(armGeo, tacticalMat); aL.position.set(0, -0.15 * s, 0); aL.castShadow = true; aL.name = 'armL_mesh'; armL.add(aL);
    var aR = new THREE.Mesh(armGeo, tacticalMat); aR.position.set(0, -0.15 * s, 0); aR.castShadow = true; aR.name = 'armR_mesh'; armR.add(aR);

    // Dirsek koruyucular
    for (var el = -1; el <= 1; el += 2) {
      var elbow = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 4, 4), kneeMat);
      elbow.position.set(el * 0.04 * s, -0.10 * s, 0.06 * s);
      elbow.scale.set(0.8, 0.6, 0.5);
      elbow.name = 'elbowPad' + (el < 0 ? 'L' : 'R');
      (el < 0 ? armL : armR).add(elbow);
    }

    // Eller (eldivenli)
    var fistGeo = new THREE.SphereGeometry(0.045 * s, 5, 5);
    var fL = new THREE.Mesh(fistGeo, gloveMat); fL.position.set(0, -0.32 * s, 0); fL.scale.set(1.3, 1, 1.1); fL.name = 'handL'; armL.add(fL);
    var fR = new THREE.Mesh(fistGeo, gloveMat); fR.position.set(0, -0.32 * s, 0); fR.scale.set(1.3, 1, 1.1); fR.name = 'handR'; armR.add(fR);

    // ===== BOYUN =====
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.14 * s, 0.06 * s, 8), skinMat);
    neck.position.set(0, 0, 0); neck.name = 'neck'; headPivot.add(neck);

    // Atkı/yaka
    var collar = new THREE.Mesh(new THREE.TorusGeometry(0.14 * s, 0.025 * s, 4, 10), darkTacticalMat);
    collar.position.set(0, 0.02 * s, 0); collar.rotation.x = Math.PI / 2; collar.name = 'collar'; headPivot.add(collar);

    // ===== KAFA =====
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 12, 12), skinMat);
    head.position.set(0, 0.07 * s, 0); head.scale.set(1, 1.15, 0.92); head.castShadow = true; head.name = 'head'; headPivot.add(head);

    // Burun
    var nose = new THREE.Mesh(new THREE.ConeGeometry(0.015 * s, 0.03 * s, 4), darkSkinMat);
    nose.position.set(0, 0.06 * s, 0.20 * s); nose.rotation.x = 0.2; nose.name = 'nose'; headPivot.add(nose);

    // Kaşlar
    var browMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 });
    for (var br = -1; br <= 1; br += 2) {
      var brow = new THREE.Mesh(new THREE.BoxGeometry(0.04 * s, 0.006 * s, 0.02 * s), browMat);
      brow.position.set(br * 0.06 * s, 0.13 * s, 0.20 * s);
      brow.rotation.z = br * 0.15;
      brow.name = 'brow_' + br; headPivot.add(brow);
    }

    // Gozler (ice gömük)
    var eyeGeo = new THREE.SphereGeometry(0.028 * s, 8, 8);
    for (var e = -1; e <= 1; e += 2) {
      var eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(e * 0.07 * s, 0.09 * s, 0.17 * s);
      eye.name = 'eye_' + e; headPivot.add(eye);
    }

    // Sac (modern kısa asker saçı)
    var hairGeo = new THREE.SphereGeometry(0.18 * s, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2.2);
    var hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.16 * s, 0.02 * s);
    hair.scale.set(1.02, 1, 0.95);
    hair.name = 'hair'; headPivot.add(hair);

    // Kulaklık (taktik headset)
    var hsMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.4 });
    var hsGeo = new THREE.TorusGeometry(0.09 * s, 0.018 * s, 5, 10, Math.PI / 2);
    var headset = new THREE.Mesh(hsGeo, hsMat);
    headset.position.set(0, 0.08 * s, -0.16 * s);
    headset.rotation.y = Math.PI;
    headset.name = 'headset'; headPivot.add(headset);

    // Mikrofonlu kulaklık kolu
    var micBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.005 * s, 0.005 * s, 0.10 * s, 4), hsMat);
    micBoom.position.set(-0.08 * s, 0.04 * s, -0.12 * s);
    micBoom.rotation.z = 0.3;
    micBoom.name = 'micBoom'; headPivot.add(micBoom);

    var mic = new THREE.Mesh(new THREE.SphereGeometry(0.008 * s, 4, 4), hsMat);
    mic.position.set(-0.11 * s, 0.02 * s, -0.08 * s);
    mic.name = 'mic'; headPivot.add(mic);

    // ===== SILAH SLOTU =====
    var weaponSlot = new THREE.Object3D();
    weaponSlot.name = 'weapon_slot';
    weaponSlot.position.set(0, -0.34 * s, 0.14 * s);
    weaponSlot.rotation.x = -0.1;
    armR.add(weaponSlot);

    g.userData.bodyMat = tacticalMat;
    g.userData.headMat = skinMat;

    return g;
  },

  animations: {
    idle: {
      duration: 2.0,
      loop: true,
      tracks: [
        { pivot: 'torso', prop: 'rotation.x', keys: [0, -0.008, 0.005, -0.008, 0] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0, 0.008, 0, -0.008, 0] },
        { pivot: 'head', prop: 'rotation.y', keys: [0, 0.06, -0.04, 0.08, 0] },
        { pivot: 'head', prop: 'rotation.x', keys: [0, -0.02, 0.01, -0.03, 0] },
        { pivot: 'armL', prop: 'rotation.x', keys: [0.12, 0.16, 0.10, 0.18, 0.12] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.10, -0.14, -0.08, -0.16, -0.10] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0.04, 0.06, 0.03, 0.07, 0.04] },
        { pivot: 'armR', prop: 'rotation.z', keys: [-0.03, -0.05, -0.02, -0.06, -0.03] },
        { pivot: 'hip', prop: 'position.y', keys: [0.32, 0.324, 0.318, 0.325, 0.32] },
        { pivot: 'hip', prop: 'position.x', keys: [0, 0.003, -0.005, 0.004, 0] }
      ]
    },
    run: {
      duration: 0.85,
      loop: true,
      tracks: [
        { pivot: 'armL', prop: 'rotation.x', keys: [0.2, 0.7, -0.2, -0.7, 0.2] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.15, -0.7, 0.15, 0.7, -0.15] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0.04, 0.12, 0.02, 0.10, 0.04] },
        { pivot: 'armR', prop: 'rotation.z', keys: [-0.03, -0.10, -0.02, -0.12, -0.03] },
        { pivot: 'legL', prop: 'rotation.x', keys: [-0.3, 0.4, 0.3, -0.4, -0.3] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0.3, -0.4, -0.3, 0.4, 0.3] },
        { pivot: 'kneeL', prop: 'rotation.x', keys: [0.15, 0.45, 0.1, 0.4, 0.15] },
        { pivot: 'kneeR', prop: 'rotation.x', keys: [0.1, 0.4, 0.15, 0.45, 0.1] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0.03, -0.06, 0.03, -0.06, 0.03] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0, 0.04, 0, -0.04, 0] },
        { pivot: 'hip', prop: 'position.y', keys: [0.32, 0.30, 0.34, 0.30, 0.32] },
        { pivot: 'head', prop: 'rotation.x', keys: [0, -0.04, 0.03, -0.04, 0] },
        { pivot: 'head', prop: 'rotation.y', keys: [0, 0.02, -0.03, 0.02, 0] }
      ]
    },
    crouch: {
      duration: 0.3,
      loop: false,
      tracks: [
        { pivot: 'hip', prop: 'position.y', keys: [0.32, 0.12] },
        { pivot: 'legL', prop: 'rotation.x', keys: [0, 0.6] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0, 0.6] },
        { pivot: 'kneeL', prop: 'rotation.x', keys: [0, -0.8] },
        { pivot: 'kneeR', prop: 'rotation.x', keys: [0, -0.8] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0, 0.25] },
        { pivot: 'armL', prop: 'rotation.x', keys: [0.12, 0.4] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.10, 0.3] }
      ]
    },
    crouch_idle: {
      duration: 0.3,
      loop: false,
      tracks: [
        { pivot: 'hip', prop: 'position.y', keys: [0.32, 0.12] },
        { pivot: 'legL', prop: 'rotation.x', keys: [0, 0.6] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0, 0.6] },
        { pivot: 'kneeL', prop: 'rotation.x', keys: [0, -0.8] },
        { pivot: 'kneeR', prop: 'rotation.x', keys: [0, -0.8] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0, 0.25] },
        { pivot: 'armL', prop: 'rotation.x', keys: [0.12, 0.4] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.10, 0.3] }
      ]
    },
    stand: {
      duration: 0.25,
      loop: false,
      tracks: [
        { pivot: 'hip', prop: 'position.y', keys: [0.12, 0.32] },
        { pivot: 'legL', prop: 'rotation.x', keys: [0.6, 0] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0.6, 0] },
        { pivot: 'kneeL', prop: 'rotation.x', keys: [-0.8, 0] },
        { pivot: 'kneeR', prop: 'rotation.x', keys: [-0.8, 0] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0.25, 0] },
        { pivot: 'armL', prop: 'rotation.x', keys: [0.4, 0.12] },
        { pivot: 'armR', prop: 'rotation.x', keys: [0.3, -0.10] }
      ]
    },
    die: {
      duration: 1.8,
      loop: false,
      tracks: [
        { pivot: 'hip', prop: 'rotation.x', keys: [0, -0.3, 0.6, 0.5] },
        { pivot: 'hip', prop: 'position.y', keys: [0.32, 0.25, 0.04, 0.04] },
        { pivot: 'hip', prop: 'position.z', keys: [0, 0.05, 0.30, 0.25] },
        { pivot: 'legL', prop: 'rotation.x', keys: [0, 0.4, 0.6, 0.5] },
        { pivot: 'legR', prop: 'rotation.x', keys: [0, 0.4, 0.6, 0.5] },
        { pivot: 'kneeL', prop: 'rotation.x', keys: [0, -0.3, -1.2, -1.0] },
        { pivot: 'kneeR', prop: 'rotation.x', keys: [0, -0.3, -1.2, -1.0] },
        { pivot: 'torso', prop: 'rotation.x', keys: [0, 0.2, 1.5, 1.3] },
        { pivot: 'torso', prop: 'rotation.z', keys: [0, 0.05, 0.2, 0.15] },
        { pivot: 'armL', prop: 'rotation.x', keys: [0.12, -0.3, -1.6, -1.3] },
        { pivot: 'armR', prop: 'rotation.x', keys: [-0.10, -0.4, -1.6, -1.3] },
        { pivot: 'armL', prop: 'rotation.z', keys: [0.04, 0.2, 0.5, 0.4] },
        { pivot: 'armR', prop: 'rotation.z', keys: [-0.03, -0.2, -0.5, -0.4] },
        { pivot: 'head', prop: 'rotation.x', keys: [0, 0.2, 0.6, 0.4] },
        { pivot: 'head', prop: 'rotation.y', keys: [0, 0.1, 0.25, 0.15] }
      ]
    }
  }
});
