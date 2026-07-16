PluginRegistry.register({
  id: 'map_arena',
  name: 'Antik Kalıntılar',
  version: '2.0',
  type: 'map',
  description: 'Antik harabe arenası — sütunlar, platform, altar',

  game: null,
  objects: [],

  init(game) {
    this.game = game;
    const scene = game.scene;
    const H = 30; // yarim boyut

    // === ZEMİN (kum/taş) ===
    const gMat = new THREE.MeshStandardMaterial({ color: 0x9a8a6a, roughness: 0.95 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), gMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
    this.objects.push(ground);

    // === TAŞ DÖŞEME (desen) ===
    const patMat = new THREE.MeshBasicMaterial({ color: 0x7a6a4a, transparent: true, opacity: 0.15, depthWrite: false });
    for (var r = 3; r <= 15; r += 3) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.05, r + 0.05, 32), patMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.005;
      scene.add(ring);
      this.objects.push(ring);
    }
    for (var a = 0; a < 8; a++) {
      var angle = a * Math.PI / 4;
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 15), patMat);
      line.position.set(Math.sin(angle) * 7.5, 0.005, Math.cos(angle) * 7.5);
      line.rotation.y = -angle;
      scene.add(line);
      this.objects.push(line);
    }

    // === MERKEZ PLATFORM ===
    var pMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.9 });
    var plat = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 0.4, 8), pMat);
    plat.position.set(0, 0.15, 0);
    plat.receiveShadow = true;
    plat.castShadow = true;
    scene.add(plat);
    this.objects.push(plat);

    // Merdiven basamaklari (4 yon)
    var stepMat = new THREE.MeshStandardMaterial({ color: 0x7a6a4a, roughness: 0.9 });
    for (var d = 0; d < 4; d++) {
      var dirAngle = d * Math.PI / 2;
      for (var s = 0; s < 3; s++) {
        var step = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.35), stepMat);
        var dist = 3.2 + s * 0.4;
        step.position.set(Math.sin(dirAngle) * dist, 0.05 + s * 0.1, Math.cos(dirAngle) * dist);
        step.rotation.y = -dirAngle;
        step.receiveShadow = true;
        scene.add(step);
        this.objects.push(step);
      }
    }

    // === ALTAR (ortadaki kutsal yapi) ===
    var aMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 });
    var aBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.8), aMat);
    aBase.position.set(0, 0.48, 0);
    aBase.castShadow = true;
    scene.add(aBase);
    this.objects.push(aBase);

    var aPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.7 }));
    aPillar.position.set(0, 0.85, 0);
    aPillar.castShadow = true;
    scene.add(aPillar);
    this.objects.push(aPillar);

    var aTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.6 }));
    aTop.position.set(0, 1.14, 0);
    aTop.castShadow = true;
    scene.add(aTop);
    this.objects.push(aTop);

    // Kristal (parlayan)
    var cryMat = new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x2288ff, emissiveIntensity: 0.4 });
    var cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), cryMat);
    cry.position.set(0, 1.25, 0);
    cry.castShadow = true;
    scene.add(cry);
    this.objects.push(cry);

    // Kristal isigi
    var glow = new THREE.PointLight(0x4488ff, 0.5, 6);
    glow.position.set(0, 1.5, 0);
    scene.add(glow);
    this.objects.push(glow);

    // === SÜTUNLAR (8 adet, daire) ===
    var cMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.85 });
    for (var i = 0; i < 8; i++) {
      var ag = i * Math.PI / 4 + Math.PI / 8;
      var cx = Math.sin(ag) * 11;
      var cz = Math.cos(ag) * 11;

      var base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.2, 10), cMat);
      base.position.set(cx, 0.1, cz);
      base.receiveShadow = true;
      scene.add(base);
      this.objects.push(base);

      var col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 3.0, 10), cMat);
      col.position.set(cx, 1.7, cz);
      col.castShadow = true;
      scene.add(col);
      this.objects.push(col);

      var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.2, 10), cMat);
      cap.position.set(cx, 3.3, cz);
      cap.castShadow = true;
      scene.add(cap);
      this.objects.push(cap);
    }

    // === YIKIK DUVARLAR (siper) ===
    var rMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.9 });
    var ruins = [
      { x: -8, z: -18, sx: 2.5, sz: 0.4, h: 1.2 },
      { x: 8, z: -18, sx: 2.5, sz: 0.4, h: 0.8 },
      { x: -18, z: -8, sx: 0.4, sz: 2.5, h: 1.0 },
      { x: -18, z: 8, sx: 0.4, sz: 2.5, h: 0.6 },
      { x: 18, z: -8, sx: 0.4, sz: 2.5, h: 1.1 },
      { x: 18, z: 8, sx: 0.4, sz: 2.5, h: 0.7 },
      { x: -8, z: 18, sx: 2.5, sz: 0.4, h: 0.9 },
      { x: 8, z: 18, sx: 2.5, sz: 0.4, h: 1.3 }
    ];
    ruins.forEach(function(r) {
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(r.sx, r.h, r.sz), rMat);
      mesh.position.set(r.x, r.h / 2, r.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      this.objects.push(mesh);
    }, this);

    // === DEVRİK SÜTUN ===
    var fMat = new THREE.MeshStandardMaterial({ color: 0x7a6a4a, roughness: 0.9 });
    var fall1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 2.5, 8), fMat);
    fall1.rotation.z = Math.PI / 2.5;
    fall1.rotation.x = 0.3;
    fall1.position.set(-14, 0.25, -14);
    fall1.castShadow = true;
    scene.add(fall1);
    this.objects.push(fall1);

    var fall2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 2.0, 8), fMat);
    fall2.rotation.x = Math.PI / 3;
    fall2.rotation.z = -0.4;
    fall2.position.set(14, 0.2, 14);
    fall2.castShadow = true;
    scene.add(fall2);
    this.objects.push(fall2);

    // === MEŞALELER (koseler) ===
    var tMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 });
    var fireMat = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff4400, emissiveIntensity: 0.6 });
    var torchPos = [[-14, -14], [14, -14], [-14, 14], [14, 14]];
    torchPos.forEach(function(pos) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6), tMat);
      pole.position.set(pos[0], 0.6, pos[1]);
      pole.castShadow = true;
      scene.add(pole);
      this.objects.push(pole);

      var fire = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), fireMat);
      fire.position.set(pos[0], 1.25, pos[1]);
      scene.add(fire);
      this.objects.push(fire);

      var pl = new THREE.PointLight(0xff6600, 0.6, 8);
      pl.position.set(pos[0], 1.3, pos[1]);
      scene.add(pl);
      this.objects.push(pl);
    }, this);

    // === SINIR DUVARLARI (tas) ===
    var wMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.9 });
    var wt = 0.4;
    var wh = 1.5;
    var wallData = [
      { x: 0, z: -H, sx: 60, sz: wt },
      { x: 0, z: H, sx: 60, sz: wt },
      { x: -H, z: 0, sx: wt, sz: 60 },
      { x: H, z: 0, sx: wt, sz: 60 }
    ];
    wallData.forEach(function(w) {
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(w.sx, wh, w.sz), wMat);
      mesh.position.set(w.x, wh / 2, w.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      this.objects.push(mesh);
    }, this);

    // === IŞIK ===
    var amb = new THREE.AmbientLight(0x605060, 0.45);
    scene.add(amb);
    this.objects.push(amb);

    var sun = new THREE.DirectionalLight(0xffaa66, 1.3);
    sun.position.set(10, 25, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    var d = 35;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.camera.far = 50;
    scene.add(sun);
    this.objects.push(sun);

    this.arenaSize = 60;
  },

  destroy() {
    const scene = this.game ? this.game.scene : null;
    if (!scene) return;
    this.objects.forEach(function(obj) {
      scene.remove(obj);
    });
    this.objects = [];
  }
});
