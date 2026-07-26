var plugin = include('registry');

plugin.register({
  id: 'model_logo',
  name: 'Deadwake Logosu',
  type: 'model',
  version: '5.0',
  description: 'Deadwake amblemi — kirik halka, uyanan goz, DEADWAKE yazisi',
  enabled: true,

  createModel() {
    var g = new THREE.Group();

    var darkMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.3, metalness: 0.7 });
    var metalMat = new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.3, metalness: 0.8 });
    var glowMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, emissive: 0xff3333, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.1 });
    var dimGlowMat = new THREE.MeshStandardMaterial({ color: 0x661111, emissive: 0x882222, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.3 });
    var crackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1, metalness: 0 });
    var innerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.6, metalness: 0.2, emissive: 0x110000, emissiveIntensity: 0.1 });

    // === DIS CEVRE ISINLARI (spikes) ===
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var spike = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 4), metalMat);
      spike.position.set(Math.sin(angle) * 0.48, Math.cos(angle) * 0.48, 0);
      spike.rotation.z = -angle;
      spike.name = 'spike_' + i;
      g.add(spike);
    }

    // === IC ZEMIN (karanlik disk) ===
    var disc = new THREE.Mesh(new THREE.CircleGeometry(0.38, 24), innerMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.z = -0.02;
    disc.name = 'disc';
    g.add(disc);

    // === UYANAN GOZ (stylized half-open eye) ===
    // Goz yuvasi (elipsoid)
    var socketMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1, metalness: 0 });
    var eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), socketMat);
    eyeSocket.position.set(0, 0.04, 0.12);
    eyeSocket.scale.set(1, 0.7, 0.4);
    eyeSocket.name = 'eyeSocket';
    g.add(eyeSocket);

    // Goz beyazi
    var whiteMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8, metalness: 0 });
    var eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), whiteMat);
    eyeball.position.set(0, 0.04, 0.16);
    eyeball.scale.set(0.9, 0.65, 0.3);
    eyeball.name = 'eyeball';
    g.add(eyeball);

    // Goz bebegi (kirmizi parlayan)
    var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), glowMat);
    pupil.position.set(0, 0.035, 0.19);
    pupil.scale.set(1, 1.2, 0.5);
    pupil.userData.isEye = true;
    pupil._isEye = true;
    pupil.name = 'pupil';
    g.add(pupil);

    // Goz glowu (disari yayilan isik)
    var eyeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.15 }));
    eyeGlow.position.copy(pupil.position);
    eyeGlow.scale.set(1.5, 1.5, 0.8);
    eyeGlow.name = 'eyeGlow';
    g.add(eyeGlow);

    // Goz kapagi (ust yarim daire - uyanma hissi)
    var lidMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.8, metalness: 0.1 });
    var lid = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
    lid.position.set(0, 0.075, 0.17);
    lid.scale.set(1, 0.4, 0.5);
    lid.name = 'eyelid';
    g.add(lid);

    // === GOZ KAPAGI (disk — perde gibi acilir, scale.y=1 kapali, scale.y=0 acik) ===
    var lidLower = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), lidMat);
    lidLower.position.set(0, 0.04, 0.19);
    lidLower.scale.set(1, 1, 1);
    lidLower.name = 'eyelidLower';
    g.add(lidLower);

    // === CIZGILER / ISINLAR (gozden yayilan) ===
    var lineMat = new THREE.MeshBasicMaterial({ color: 0xff4422, transparent: true, opacity: 0.15 });
    for (var li = 0; li < 5; li++) {
      var lAngle = -0.6 + li * 0.3;
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.12, 0.002), lineMat);
      line.position.set(Math.sin(lAngle) * 0.05, 0.04, 0.15 + Math.cos(lAngle) * 0.06);
      line.rotation.z = lAngle;
      line.name = 'ray_' + li;
      g.add(line);
    }

    // === CATLAKLAR ===
    var crack1 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.005), crackMat);
    crack1.position.set(0.10, -0.08, 0.12);
    crack1.rotation.z = 0.6;
    crack1.name = 'crack1';
    g.add(crack1);

    var crack2 = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.04, 0.005), crackMat);
    crack2.position.set(-0.08, -0.06, 0.12);
    crack2.rotation.z = -0.4;
    crack2.name = 'crack2';
    g.add(crack2);

    var crack3 = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.03, 0.004), crackMat);
    crack3.position.set(-0.12, -0.02, 0.12);
    crack3.rotation.z = -0.8;
    crack3.name = 'crack3';
    g.add(crack3);

    // === ALT GLOW HALKASI ===
    var glowRing = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.50, 32), new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.04, side: THREE.DoubleSide }));
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.z = -0.01;
    glowRing.name = 'glowRing';
    g.add(glowRing);

    // === "DEADWAKE" YAZISI (canvas texture, Fjalla One font) ===
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 96);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow
    ctx.shadowColor = 'rgba(200, 30, 30, 0.6)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 54px "Fjalla One", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('DEADWAKE', 256, 48);

    // Red outline layer
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#cc3333';
    ctx.font = '400 54px "Fjalla One", sans-serif';
    ctx.fillText('DEADWAKE', 256, 48);

    // White core
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 52px "Fjalla One", sans-serif';
    ctx.fillText('DEADWAKE', 256, 48);

    var textMat = new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      emissive: 0xff4422,
      emissiveIntensity: 0.2,
      emissiveMap: new THREE.CanvasTexture(canvas),
      side: THREE.DoubleSide,
      depthWrite: false
    });
    textMat.map.needsUpdate = true;
    textMat.emissiveMap.needsUpdate = true;

    var textPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.13), textMat);
    textPlane.position.set(0, -0.32, 0.05);
    textPlane.name = 'textDeadwake';
    g.add(textPlane);

    // === YAN GLOW TÜPLERI (textin iki yaninda) ===
    var tubeMat = new THREE.MeshBasicMaterial({ color: 0xff3311, transparent: true, opacity: 0.2 });
    var lTube = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 4), tubeMat);
    lTube.position.set(-0.40, -0.32, 0.05);
    lTube.name = 'glowTubeL';
    g.add(lTube);

    var rTube = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 4), tubeMat);
    rTube.position.set(0.40, -0.32, 0.05);
    rTube.name = 'glowTubeR';
    g.add(rTube);

    // === GOZ ALTINDAKI DAMLA/KAN (stylized) ===
    var dripMat = new THREE.MeshStandardMaterial({ color: 0x440000, emissive: 0x661111, emissiveIntensity: 0.1, roughness: 0.9 });
    var drip = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), dripMat);
    drip.position.set(0.02, -0.06, 0.13);
    drip.scale.set(1, 1.5, 0.5);
    drip.name = 'drip';
    g.add(drip);

    return g;
  }
});
