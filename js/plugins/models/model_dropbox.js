var plugin = include('registry');

plugin.register({
  id: 'model_dropbox',
  name: 'Drop Kutusu',
  type: 'model',
  version: '1.0',
  description: 'Ahşap drop kutusu — paraşüt alt modeli eklenip çıkarılabilir',

  thumbnailCam: [2.5, 1.8, 2.5],
  thumbnailOffset: [0, -0.2, 0],

  createModel() {
    var group = new THREE.Group();

    var woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.9, metalness: 0 });
    var darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x6a4f34, roughness: 0.9, metalness: 0 });
    var bandMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.6 });
    var accentMat = new THREE.MeshStandardMaterial({ color: 0xd4a843, roughness: 0.4, metalness: 0.3 });
    var fabricMat = new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
    var fabricInnerMat = new THREE.MeshStandardMaterial({ color: 0xdd6666, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    var ropeMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.9, metalness: 0 });

    var s = 0.8;

    // ===== KASA =====
    var box = new THREE.Mesh(new THREE.BoxGeometry(s * 0.8, s * 0.6, s * 0.8), woodMat);
    box.position.set(0, 0, 0);
    box.castShadow = true;
    box.name = 'crate';
    box.userData.walkable = false;
    group.add(box);

    // Köşe bantları (dikey)
    for (var x = -1; x <= 1; x += 2) {
      for (var z = -1; z <= 1; z += 2) {
        var corner = new THREE.Mesh(new THREE.BoxGeometry(0.04, s * 0.62, 0.04), bandMat);
        corner.position.set(x * s * 0.38, 0, z * s * 0.38);
        corner.name = 'corner_' + x + '_' + z;
        group.add(corner);
      }
    }

    // Yatay çember bantlar
    for (var b = -1; b <= 1; b += 2) {
      var bandH = new THREE.Mesh(new THREE.BoxGeometry(s * 0.82, 0.04, 0.04), bandMat);
      bandH.position.set(0, b * s * 0.15, s * 0.39);
      bandH.name = 'bandH_' + b;
      group.add(bandH);

      var bandH2 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.82, 0.04, 0.04), bandMat);
      bandH2.position.set(0, b * s * 0.15, -s * 0.39);
      bandH2.name = 'bandH2_' + b;
      group.add(bandH2);
    }

    for (var b2 = -1; b2 <= 1; b2 += 2) {
      var bandV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, s * 0.82), bandMat);
      bandV.position.set(b2 * s * 0.39, s * 0.15, 0);
      bandV.name = 'bandV_' + b2;
      group.add(bandV);

      var bandV2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, s * 0.82), bandMat);
      bandV2.position.set(b2 * s * 0.39, -s * 0.15, 0);
      bandV2.name = 'bandV2_' + b2;
      group.add(bandV2);
    }

    // Kilit mekanizması (üstte)
    var lockBase = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.1, s * 0.12, 0.04, 8), accentMat);
    lockBase.position.set(0, s * 0.33, 0);
    lockBase.name = 'lockBase';
    group.add(lockBase);

    var lockRing = new THREE.Mesh(new THREE.TorusGeometry(s * 0.06, 0.02, 6, 8), accentMat);
    lockRing.position.set(0, s * 0.37, 0);
    lockRing.rotation.x = Math.PI / 2;
    lockRing.name = 'lockRing';
    group.add(lockRing);

    // Uyarı şeritleri (sarı-siyah)
    for (var st = 0; st < 4; st++) {
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(s * 0.82, 0.015, 0.01), new THREE.MeshStandardMaterial({
        color: st % 2 === 0 ? 0xd4a843 : 0x111111, roughness: 0.5
      }));
      stripe.position.set(0, s * 0.28 - st * s * 0.06, s * 0.395);
      stripe.name = 'stripe_' + st;
      group.add(stripe);

      var stripe2 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.82, 0.015, 0.01), new THREE.MeshStandardMaterial({
        color: st % 2 === 0 ? 0xd4a843 : 0x111111, roughness: 0.5
      }));
      stripe2.position.set(0, s * 0.28 - st * s * 0.06, -s * 0.395);
      stripe2.name = 'stripe2_' + st;
      group.add(stripe2);
    }

    // ===== PARAŞÜT (alt model) =====
    var chuteGroup = new THREE.Group();
    chuteGroup.name = 'parachute';

    // Kubbe (yarım küre)
    var domeGeo = new THREE.SphereGeometry(s * 0.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    var dome = new THREE.Mesh(domeGeo, fabricMat);
    dome.position.set(0, s * 1.0, 0);
    dome.scale.set(1, 0.5, 1);
    dome.name = 'dome';
    chuteGroup.add(dome);

    // Kubbe içi
    var domeInner = new THREE.Mesh(domeGeo, fabricInnerMat);
    domeInner.position.set(0, s * 1.0, 0);
    domeInner.scale.set(0.95, 0.45, 0.95);
    domeInner.name = 'domeInner';
    chuteGroup.add(domeInner);

    // Kubbe dilim çizgileri (dome yüzeyini takip eden eğriler)
    for (var r = 0; r < 6; r++) {
      var angle = (r / 6) * Math.PI * 2;
      var pts = [];
      for (var t = 0; t <= 12; t++) {
        var frac = t / 12;
        var radius = frac * s * 0.55;
        var yOff = Math.cos(frac * Math.PI / 2) * s * 0.28;
        pts.push(new THREE.Vector3(
          Math.sin(angle) * radius,
          s * 1.0 + yOff,
          Math.cos(angle) * radius
        ));
      }
      var ribGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var rib = new THREE.Line(ribGeo, new THREE.LineBasicMaterial({ color: 0xcc3333, linewidth: 1 }));
      rib.name = 'rib_' + r;
      chuteGroup.add(rib);
    }

    // İpler
    var ropePoints = [
      [s * -0.32, 0, s * -0.32], [s * 0.32, 0, s * -0.32],
      [s * -0.32, 0, s * 0.32], [s * 0.32, 0, s * 0.32]
    ];

    ropePoints.forEach(function(pt, i) {
      var start = new THREE.Vector3(pt[0], pt[1], pt[2]);
      var end = new THREE.Vector3(pt[0] * 0.2, s * 0.75, pt[2] * 0.2);

      var mid1 = new THREE.Vector3().lerpVectors(start, end, 0.3);
      mid1.y += s * 0.1;
      var mid2 = new THREE.Vector3().lerpVectors(start, end, 0.7);
      mid2.y += s * 0.05;

      var curve = new THREE.CubicBezierCurve3(start, mid1, mid2, end);
      var curvePts = curve.getPoints(10);
      var ropeGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
      var rope = new THREE.Line(ropeGeo, new THREE.LineBasicMaterial({ color: 0x8a7a6a }));
      rope.name = 'rope_' + i;
      chuteGroup.add(rope);

      // Kalın ip (mesh)
      var rSegs = [];
      for (var ci = 0; ci < curvePts.length - 1; ci++) {
        var dist = curvePts[ci].distanceTo(curvePts[ci + 1]);
        var dir = new THREE.Vector3().copy(curvePts[ci + 1]).sub(curvePts[ci]).normalize();
        var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, dist, 3), ropeMat);
        rod.position.copy(curvePts[ci]).add(dir.clone().multiplyScalar(dist / 2));
        rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        rod.name = 'ropeMesh_' + i + '_' + ci;
        chuteGroup.add(rod);
      }
    });

    // Merkez bağlantı halkası
    var centerRing = new THREE.Mesh(new THREE.TorusGeometry(s * 0.05, 0.015, 6, 8), accentMat);
    centerRing.position.set(0, s * 0.75, 0);
    centerRing.rotation.x = Math.PI / 2;
    centerRing.name = 'centerRing';
    chuteGroup.add(centerRing);

    // Kubbe tepesinden merkez halkaya siyah ip
    var apexY = s * 1.0 + s * 0.28;
    var apexRope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, apexY - s * 0.75, 4), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    apexRope.position.set(0, (apexY + s * 0.75) / 2, 0);
    apexRope.name = 'apexRope';
    chuteGroup.add(apexRope);

    // Paraşütü gruba ekle
    group.add(chuteGroup);

    return group;
  },

  animations: {
    idle: {
      duration: 4,
      loop: true,
      tracks: [
        { pivot: 'parachute', prop: 'rotation.y', keys: [0, 0.05, -0.05, 0] },
        { pivot: 'parachute', prop: 'rotation.x', keys: [0.02, -0.02, 0.03, 0.02] }
      ]
    },
    floating: {
      duration: 3,
      loop: true,
      tracks: [
        { pivot: 'parachute', prop: 'rotation.z', keys: [0, 0.06, -0.06, 0] },
        { pivot: 'parachute', prop: 'rotation.x', keys: [0.02, -0.03, 0.04, 0.02] },
        { pivot: '', prop: 'rotation.y', keys: [0, 0.1, -0.1, 0] }
      ]
    }
  }
});
