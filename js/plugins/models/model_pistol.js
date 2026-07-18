var plugin = include('registry');

plugin.register({
  id: 'model_pistol',
  name: 'Tabanca',
  type: 'model',
  version: '3.0',
  description: 'Glock 18 stili tabanca modeli — view modelde kullanilir',
  enabled: true,

  thumbnailCam: [1.66, 0.9, 2.76],
  thumbnailOffset: [0.35, 0, 0],

  createModel() {
    var group = new THREE.Group();

    var steelMat = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.7, roughness: 0.3 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.6, roughness: 0.35 });
    var blackMat = new THREE.MeshStandardMaterial({ color: 0x2a2a33, metalness: 0.5, roughness: 0.4 });
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, metalness: 0 });
    var gripMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95, metalness: 0 });
    var darkGripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });

    // === SLIDE (Glock kare govde) ===
    var slide = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.034, 0.19), steelMat);
    slide.position.set(0, 0.034, 0.16);
    slide.name = 'slide';
    group.add(slide);

    // Slide chamfer (on kisim egimi)
    var chamfer = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.028, 0.025), steelMat);
    chamfer.position.set(0, 0.034, 0.285);
    chamfer.name = 'slide_chamfer';
    group.add(chamfer);

    // Slide top
    var slideTop = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.008, 0.16), darkMat);
    slideTop.position.set(0, 0.046, 0.15);
    slideTop.name = 'slide_top';
    group.add(slideTop);

    // Rear serrations
    for (var i = 0; i < 7; i++) {
      var serr = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.004, 0.003), blackMat);
      serr.position.set(0, 0.058, 0.06 + i * 0.008);
      serr.name = 'serration_' + i;
      group.add(serr);
    }

    // Ejection port
    var port = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.05), blackMat);
    port.position.set(0, 0.04, 0.16);
    port.name = 'eject_port';
    group.add(port);

    // === BARREL ===
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.12, 8), steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, 0.25);
    barrel.name = 'barrel';
    group.add(barrel);

    var barrelInner = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.12, 8), blackMat);
    barrelInner.rotation.x = Math.PI / 2;
    barrelInner.position.set(0, 0.01, 0.25);
    barrelInner.name = 'barrel_inner';
    group.add(barrelInner);

    var muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.017, 0.008, 8), blackMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.01, 0.305);
    muzzle.name = 'muzzle';
    group.add(muzzle);

    // === POLYMER FRAME ===
    var frame = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.02, 0.10), frameMat);
    frame.position.set(0, 0.0, 0.13);
    frame.name = 'frame';
    group.add(frame);

    var rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.08), darkMat);
    rail.position.set(0, 0.018, 0.13);
    rail.name = 'frame_rail';
    group.add(rail);

    // Trigger guard (Glock dikdortgenimsi)
    var tgShape = new THREE.Shape();
    tgShape.moveTo(-0.016, -0.015);
    tgShape.quadraticCurveTo(-0.022, -0.04, -0.008, -0.05);
    tgShape.quadraticCurveTo(0.008, -0.05, 0.022, -0.04);
    tgShape.quadraticCurveTo(0.016, -0.015, 0.016, -0.015);
    var tgGeo = new THREE.ExtrudeGeometry(tgShape, { depth: 0.012, bevelEnabled: false });
    var tGuard = new THREE.Mesh(tgGeo, frameMat);
    tGuard.position.set(0, 0, 0.07);
    tGuard.rotation.y = Math.PI / 2;
    tGuard.name = 'trigger_guard';
    group.add(tGuard);

    var trigger = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.022, 0.005), steelMat);
    trigger.position.set(0, -0.016, 0.09);
    trigger.name = 'trigger';
    group.add(trigger);

    var safety = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.004), steelMat);
    safety.position.set(0, -0.006, 0.09);
    safety.name = 'trigger_safety';
    group.add(safety);

    // === GRIP — Glock tarzi dikdortgen ===
    var grip = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.065, 0.036), gripMat);
    grip.position.set(0, -0.035, 0.072);
    grip.rotation.x = 0.18;
    grip.name = 'grip';
    group.add(grip);

    // Backstrap
    var bs = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.055, 0.01), gripMat);
    bs.position.set(0, -0.035, 0.097);
    bs.rotation.x = 0.18;
    bs.name = 'grip_backstrap';
    group.add(bs);

    // Grip texture lines
    for (var r = 0; r < 6; r++) {
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0015, 0.002), darkGripMat);
      line.position.set(0, -0.06 + r * 0.009, 0.09);
      line.rotation.x = 0.18;
      line.name = 'grip_line_' + r;
      group.add(line);
    }

    // Finger grooves
    for (var g = 0; g < 2; g++) {
      var fg = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.003, 0.004), gripMat);
      fg.position.set(0, -0.05 + g * 0.018, 0.09);
      fg.rotation.x = 0.18;
      fg.name = 'finger_groove_' + g;
      group.add(fg);
    }

    // Side panels
    for (var s = -1; s <= 1; s += 2) {
      var panel = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.05, 0.028), darkGripMat);
      panel.position.set(s * 0.014, -0.035, 0.072);
      panel.rotation.x = 0.18;
      panel.name = 'grip_panel_' + (s > 0 ? 'r' : 'l');
      group.add(panel);
    }

    // Magwell
    var mw = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.006, 0.036), frameMat);
    mw.position.set(0, -0.073, 0.072);
    mw.name = 'magwell';
    group.add(mw);

    // Magazine
    var mag = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.025, 0.026), darkMat);
    mag.position.set(0, -0.072, 0.072);
    mag.name = 'magazine';
    group.add(mag);

    // Magazine base
    var magBase = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.005, 0.03), blackMat);
    magBase.position.set(0, -0.086, 0.072);
    magBase.name = 'mag_base';
    group.add(magBase);

    // === SLIDE STOP ===
    var slideStop = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.022, 0.006), blackMat);
    slideStop.position.set(0.024, 0.008, 0.10);
    slideStop.name = 'slide_stop';
    group.add(slideStop);

    var stopLever = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.01), blackMat);
    stopLever.position.set(0.024, -0.006, 0.10);
    stopLever.name = 'slide_stop_lever';
    group.add(stopLever);

    // === TAKE-DOWN LEVER ===
    var td = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.006, 0.012), blackMat);
    td.position.set(0.022, 0.008, 0.05);
    td.name = 'take_down';
    group.add(td);

    // === SIGHTS ===
    var rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.008, 0.004), blackMat);
    rearSight.position.set(0, 0.055, 0.07);
    rearSight.name = 'rear_sight';
    group.add(rearSight);

    var frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.01, 0.003), blackMat);
    frontSight.position.set(0, 0.054, 0.26);
    frontSight.name = 'front_sight';
    group.add(frontSight);

    var dotFS = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 0.3 }));
    dotFS.position.set(0, 0.062, 0.26);
    dotFS.name = 'front_dot';
    group.add(dotFS);

    // Barrel tip
    var tip = new THREE.Object3D();
    tip.position.set(0, 0.01, 0.31);
    tip.name = 'barrel_tip';
    group.add(tip);

    return group;
  },

  animations: {
    fire: {
      duration: 0.25,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.z', keys: [0, 0.02, 0.005, 0] },
        { pivot: '__self__', prop: 'position.y', keys: [0, 0.008, -0.002, 0] },
        { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.06, -0.01, 0] }
      ]
    },
    reload: {
      duration: 1.5,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.y', keys: [0, -0.05, -0.05, -0.03, -0.01, 0] },
        { pivot: '__self__', prop: 'position.z', keys: [0, 0.015, 0.015, 0, -0.05, 0] },
        { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.15, 0.18, 0.05, -0.04, 0] },
        { pivot: '__self__', prop: 'rotation.z', keys: [0, -0.07, -0.09, -0.02, 0.02, 0] }
      ]
    },
    equip: {
      duration: 2.0,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.y', keys: [-0.7, -0.5, -0.1, 0.15, 0.05, 0] },
        { pivot: '__self__', prop: 'position.z', keys: [0.35, 0.3, 0.2, 0.08, 0.02, 0] },
        { pivot: '__self__', prop: 'position.x', keys: [0.08, 0.04, 0.02, 0, 0, 0] },
        { pivot: '__self__', prop: 'rotation.x', keys: [0, -3.14, -6.28, -9.42, -12.56, -12.56] },
        { pivot: '__self__', prop: 'rotation.z', keys: [0.15, -0.08, 0.06, -0.03, 0, 0] }
      ]
    }
  }
});
