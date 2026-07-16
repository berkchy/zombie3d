PluginRegistry.register({
  id: 'model_pistol',
  name: 'Tabanca',
  type: 'model',
  version: '2.0',
  description: 'Detayli ince tabanca modeli — view modelde kullanilir',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    var steelMat = new THREE.MeshStandardMaterial({ color: 0x7788aa, metalness: 0.8, roughness: 0.25 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.7, roughness: 0.35 });
    var blackMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.6, roughness: 0.4 });
    var gripMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.95, metalness: 0 });
    var darkGripMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 });

    // === SLIDE (govde) ===
    var slide = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.20), steelMat);
    slide.position.set(0, 0.035, 0.16);
    slide.name = 'slide';
    group.add(slide);

    // Slide top (daha ince ust kisim)
    var slideTop = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.01, 0.16), blackMat);
    slideTop.position.set(0, 0.048, 0.15);
    slideTop.name = 'slide_top';
    group.add(slideTop);

    // Slide serrations (cizgiler)
    for (var i = 0; i < 5; i++) {
      var serr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.003, 0.004), darkMat);
      serr.position.set(0, 0.052, 0.06 + i * 0.008);
      serr.name = 'serration_' + i;
      group.add(serr);
    }

    // Ejection port
    var port = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, 0.04), blackMat);
    port.position.set(0, 0.045, 0.15);
    port.name = 'eject_port';
    group.add(port);

    // === BARREL (namlu) ===
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.18, 8), steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.012, 0.30);
    barrel.name = 'barrel';
    group.add(barrel);

    // Barrel inner (namlu ici)
    var barrelInner = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.18, 8), blackMat);
    barrelInner.rotation.x = Math.PI / 2;
    barrelInner.position.set(0, 0.012, 0.30);
    barrelInner.name = 'barrel_inner';
    group.add(barrelInner);

    // Barrel bushing (namlu agzi bilezigi)
    var bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.02, 0.025, 8), darkMat);
    bushing.rotation.x = Math.PI / 2;
    bushing.position.set(0, 0.012, 0.40);
    bushing.name = 'bushing';
    group.add(bushing);

    // Muzzle (en uctaki halka)
    var muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.01, 8), blackMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.012, 0.415);
    muzzle.name = 'muzzle';
    group.add(muzzle);

    // === FRAME (alt govde) ===
    var frame = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.12), darkMat);
    frame.position.set(0, 0.0, 0.12);
    frame.name = 'frame';
    group.add(frame);

    // Trigger guard (tetik korumasi)
    var tgShape = new THREE.Shape();
    tgShape.moveTo(-0.015, -0.015);
    tgShape.quadraticCurveTo(-0.02, -0.05, 0, -0.05);
    tgShape.quadraticCurveTo(0.02, -0.05, 0.015, -0.015);
    var tgGeo = new THREE.ExtrudeGeometry(tgShape, { depth: 0.012, bevelEnabled: false });
    var tGuard = new THREE.Mesh(tgGeo, darkMat);
    tGuard.position.set(0, 0, 0.08);
    tGuard.rotation.y = Math.PI / 2;
    tGuard.name = 'trigger_guard';
    group.add(tGuard);

    // Trigger (tetik)
    var trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.005), steelMat);
    trigger.position.set(0, -0.015, 0.09);
    trigger.name = 'trigger';
    group.add(trigger);

    // === GRIP (kabza) ===
    var grip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.08, 0.04), gripMat);
    grip.position.set(0, -0.045, 0.04);
    grip.rotation.z = -0.08;
    grip.name = 'grip';
    group.add(grip);

    // Grip panels (kabza yan paneli)
    for (var s = -1; s <= 1; s += 2) {
      var panel = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.06, 0.03), darkGripMat);
      panel.position.set(s * 0.016, -0.045, 0.04);
      panel.name = 'grip_panel_' + (s > 0 ? 'r' : 'l');
      group.add(panel);
    }

    // Grip checkering (kabza puanlari)
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var dot = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.002), darkGripMat);
        dot.position.set((c - 1) * 0.008, -0.025 + r * 0.02, 0.058);
        dot.name = 'checker_' + r + '_' + c;
        group.add(dot);
      }
    }

    // Magazine (sarjor)
    var mag = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.04, 0.028), darkMat);
    mag.position.set(0, -0.095, 0.04);
    mag.name = 'magazine';
    group.add(mag);

    // Magazine base
    var magBase = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.006, 0.03), blackMat);
    magBase.position.set(0, -0.118, 0.04);
    magBase.name = 'mag_base';
    group.add(magBase);

    // === SLIDE STOP / RELEASE ===
    var slideStop = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.025, 0.008), darkMat);
    slideStop.position.set(0.022, 0.01, 0.10);
    slideStop.name = 'slide_stop';
    group.add(slideStop);

    // === HAMMER (horoz) ===
    var hammer = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.02, 0.008), darkMat);
    hammer.position.set(0, 0.048, 0.05);
    hammer.name = 'hammer';
    group.add(hammer);

    // === SIGHTS (gezler) ===
    var rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.01, 0.005), blackMat);
    rearSight.position.set(0, 0.06, 0.06);
    rearSight.name = 'rear_sight';
    group.add(rearSight);

    // Rear sight notch
    var notch = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.005, 0.003), blackMat);
    notch.position.set(0, 0.07, 0.06);
    notch.name = 'rear_notch';
    group.add(notch);

    var frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.004), blackMat);
    frontSight.position.set(0, 0.058, 0.28);
    frontSight.name = 'front_sight';
    group.add(frontSight);

    // Front sight dot
    var dotFS = new THREE.Mesh(new THREE.SphereGeometry(0.003, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 0.3 }));
    dotFS.position.set(0, 0.066, 0.28);
    dotFS.name = 'front_dot';
    group.add(dotFS);

    // Barrel tip (mermi cikisi)
    var tip = new THREE.Object3D();
    tip.position.set(0, 0.012, 0.42);
    tip.name = 'barrel_tip';
    group.add(tip);

    return group;
  },

  animations: {
    fire: {
      duration: 0.25,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.z', keys: [0, -0.008, -0.002, 0] },
        { pivot: '__self__', prop: 'position.y', keys: [0, 0.004, -0.001, 0] },
        { pivot: '__self__', prop: 'rotation.x', keys: [0, -0.025, 0.004, 0] }
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
