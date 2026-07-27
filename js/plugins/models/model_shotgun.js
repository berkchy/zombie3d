var plugin = include('registry');

plugin.register({
  id: 'model_shotgun',
  name: 'Pompali',
  type: 'model',
  version: '2.0',
  description: 'Taktik pompali tufek — detayli model + animasyon',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    var steelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.15 });
    var receiverMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.35 });
    var barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95, roughness: 0.1 });
    var furnitureMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95, metalness: 0 });
    var gripMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.05 });
    var railMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.3 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4, roughness: 0.5 });
    var accMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.3 });
    var shellMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.3, metalness: 0.1 });

    // === RECEIVER ===
    var recv = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.17), receiverMat);
    recv.position.set(0, 0.02, 0.06);
    recv.name = 'receiver';
    group.add(recv);

    // Receiver top — rear
    var recvTop = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.015, 0.04), receiverMat);
    recvTop.position.set(0, 0.05, -0.025);
    recvTop.name = 'receiver_top';
    group.add(recvTop);

    // Receiver rear tang
    var tang = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.025), receiverMat);
    tang.position.set(0, 0.015, -0.06);
    tang.name = 'receiver_tang';
    group.add(tang);

    // === BARREL ===
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.4, 10), barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, 0.32);
    barrel.name = 'barrel';
    group.add(barrel);

    // Barrel extension (chamber area)
    var barrelExt = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.035, 10), barrelMat);
    barrelExt.rotation.x = Math.PI / 2;
    barrelExt.position.set(0, 0.015, 0.145);
    barrelExt.name = 'barrel_ext';
    group.add(barrelExt);

    // Barrel bead front sight
    var bead = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), accMat);
    bead.position.set(0, 0.036, 0.5);
    bead.name = 'bead_sight';
    group.add(bead);

    // Ventilated rib (top of barrel)
    for (var vr = 0; vr < 12; vr++) {
      var rib = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, 0.02), darkMat);
      rib.position.set(0, 0.025, 0.2 + vr * 0.03);
      rib.name = 'vent_rib_' + vr;
      group.add(rib);
    }

    // === MAGAZINE TUBE ===
    var magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.32, 10), barrelMat);
    magTube.rotation.x = Math.PI / 2;
    magTube.position.set(0, -0.02, 0.28);
    magTube.name = 'mag_tube';
    group.add(magTube);

    // Magazine tube cap
    var magCap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.015, 10), steelMat);
    magCap.rotation.x = Math.PI / 2;
    magCap.position.set(0, -0.02, 0.46);
    magCap.name = 'mag_cap';
    group.add(magCap);

    // Magazine tube ring (barrel clamp)
    var clamp = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 6, 10), darkMat);
    clamp.position.set(0, -0.002, 0.38);
    clamp.rotation.y = Math.PI / 2;
    clamp.name = 'barrel_clamp';
    group.add(clamp);

    // === PUMP / FOREND ===
    var pumpBody = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.028, 0.1), furnitureMat);
    pumpBody.position.set(0, -0.028, 0.27);
    pumpBody.name = 'pump';
    group.add(pumpBody);

    // Pump grip texture (serrated)
    for (var pt = 0; pt < 6; pt++) {
      var groove = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.002, 0.005), gripMat);
      groove.position.set(0, -0.04, 0.235 + pt * 0.012);
      groove.name = 'pump_groove_' + pt;
      group.add(groove);
    }

    // Pump front cap
    var pumpFront = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.025, 0.01), receiverMat);
    pumpFront.position.set(0, -0.028, 0.325);
    pumpFront.name = 'pump_front';
    group.add(pumpFront);

    // Pump rails (side)
    for (var pr = -1; pr <= 1; pr += 2) {
      var pRail = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.018, 0.08), railMat);
      pRail.position.set(pr * 0.025, -0.028, 0.27);
      pRail.name = 'pump_rail_' + (pr > 0 ? 'r' : 'l');
      group.add(pRail);
    }

    // === STOCK ===
    var stockBody = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.055, 0.15), furnitureMat);
    stockBody.position.set(0, 0.01, -0.1);
    stockBody.name = 'stock';
    group.add(stockBody);

    // Stock pistol grip
    var stockGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.04), furnitureMat);
    stockGrip.position.set(0, -0.03, -0.03);
    stockGrip.name = 'stock_grip';
    group.add(stockGrip);

    // Stock heel
    var heel = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.07, 0.025), gripMat);
    heel.position.set(0, -0.005, -0.19);
    heel.name = 'stock_heel';
    group.add(heel);

    // Stock checkering (side panels)
    for (var sc = -1; sc <= 1; sc += 2) {
      var panel = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.04, 0.08), gripMat);
      panel.position.set(sc * 0.025, 0.01, -0.1);
      panel.name = 'stock_panel_' + (sc > 0 ? 'r' : 'l');
      group.add(panel);
    }

    // Stock bolts
    for (var b = -1; b <= 1; b += 2) {
      var bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.003, 6), steelMat);
      bolt.position.set(b * 0.02, 0.0, -0.15);
      bolt.name = 'stock_bolt_' + (b > 0 ? 'r' : 'l');
      group.add(bolt);
    }

    // === TRIGGER GUARD ===
    var tgShape = new THREE.Shape();
    tgShape.moveTo(-0.018, -0.01);
    tgShape.quadraticCurveTo(-0.022, -0.04, 0, -0.045);
    tgShape.quadraticCurveTo(0.022, -0.04, 0.018, -0.01);
    var tgGeo = new THREE.ExtrudeGeometry(tgShape, { depth: 0.012, bevelEnabled: false });
    var tGuard = new THREE.Mesh(tgGeo, accMat);
    tGuard.position.set(0, 0.005, 0.06);
    tGuard.rotation.y = Math.PI / 2;
    tGuard.name = 'trigger_guard';
    group.add(tGuard);

    // Trigger
    var trigger = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.02, 0.004), steelMat);
    trigger.position.set(0, -0.005, 0.07);
    trigger.name = 'trigger';
    group.add(trigger);

    // Trigger pin
    var pin = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.04, 6), steelMat);
    pin.position.set(0, 0.02, 0.065);
    pin.name = 'trigger_pin';
    group.add(pin);

    // === SHELL CARRIER / LOADING PORT ===
    var carrier = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.018), steelMat);
    carrier.position.set(0, -0.04, 0.1);
    carrier.name = 'shell_carrier';
    group.add(carrier);

    // Shell (one visible in carrier)
    var shell = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.035, 8), shellMat);
    shell.rotation.x = Math.PI / 2;
    shell.position.set(0, -0.035, 0.1);
    shell.name = 'shell';
    group.add(shell);

    // Shell rim
    var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.006, 0.004, 8), accMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, -0.035, 0.082);
    rim.name = 'shell_rim';
    group.add(rim);

    // Loading port target (hand shell'in hedef pozisyonu)
    var loadTarget = new THREE.Object3D();
    loadTarget.position.set(0, -0.035, 0.1);
    loadTarget.name = 'load_target';
    group.add(loadTarget);

    // === PICATINNY RAIL (top) ===
    for (var ri = 0; ri < 6; ri++) {
      var rSeg = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.012), railMat);
      rSeg.position.set(0, 0.062, 0.02 + ri * 0.018);
      rSeg.name = 'rail_seg_' + ri;
      group.add(rSeg);
    }

    // === REAR SIGHT (ghost ring) ===
    var rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.018, 0.006), darkMat);
    rearSight.position.set(0, 0.068, -0.03);
    rearSight.name = 'rear_sight';
    group.add(rearSight);

    // Rear sight ring
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.002, 6, 8), darkMat);
    ring.position.set(0, 0.072, -0.03);
    ring.name = 'rear_ring';
    group.add(ring);

    // === FRONT SIGHT ===
    var frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.02, 0.004), darkMat);
    frontSight.position.set(0, 0.048, 0.5);
    frontSight.name = 'front_sight';
    group.add(frontSight);

    // Front sight ears
    for (var fe = -1; fe <= 1; fe += 2) {
      var fEar = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.015, 0.003), darkMat);
      fEar.position.set(fe * 0.007, 0.04, 0.5);
      fEar.name = 'front_ear_' + (fe > 0 ? 'r' : 'l');
      group.add(fEar);
    }

    // === SAFETY (tang mounted) ===
    var safety = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.004, 0.008), accMat);
    safety.position.set(0, 0.055, -0.02);
    safety.name = 'safety';
    group.add(safety);

    // === EJECTION PORT ===
    var ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.018, 0.04), darkMat);
    ejPort.position.set(0.028, 0.03, 0.07);
    ejPort.name = 'ejection_port';
    group.add(ejPort);

    // === BARREL TIP (muzzle - where bullets exit) ===
    var muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.015, 0.52);
    muzzle.name = 'barrel_tip';
    group.add(muzzle);

    // Muzzle flash reference
    var flashRef = new THREE.Object3D();
    flashRef.position.set(0, 0.015, 0.52);
    flashRef.name = 'flash_ref';
    group.add(flashRef);

    return group;
  },

  animations: {
    idle: {
      duration: 3.0,
      loop: true,
      tracks: [
        { pivot: '__self__', prop: 'position.y', keys: [0, 0.002, -0.001, -0.002, 0] },
        { pivot: '__self__', prop: 'position.x', keys: [0, -0.001, 0.001, 0.001, 0] },
        { pivot: '__self__', prop: 'rotation.z', keys: [0, 0.002, -0.001, -0.002, 0] }
      ]
    },
    fire: {
      duration: 1.2,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.z', keys: [0, 0.06, 0.03, 0.01, 0] },
        { pivot: '__self__', prop: 'position.y', keys: [0, 0.03, 0, 0, 0] },
        { pivot: '__self__', prop: 'rotation.x', keys: [0, -0.18, -0.06, -0.01, 0] },
        { pivot: '__self__', prop: 'rotation.z', keys: [0, 0.04, 0.01, 0, 0] },
        { pivot: 'pump', prop: 'position.z', keys: [0.28, 0.28, 0.28, 0.28, 0.12, 0.28] }
      ]
    },
    reload: {
      duration: 1.1,
      loop: true,
      tracks: [
        { pivot: '__self__', prop: 'rotation.z', keys: [0, -0.2, -0.22, -0.2, 0] }
      ]
    },
    equip: {
      duration: 1.5,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.y', keys: [-0.6, -0.35, -0.08, 0.15, 0.05, 0] },
        { pivot: '__self__', prop: 'position.z', keys: [0.3, 0.25, 0.18, 0.06, 0.02, 0] },
        { pivot: '__self__', prop: 'position.x', keys: [0.06, 0.03, 0.01, 0, 0, 0] },
        { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.12, 0.06, -0.01, 0.01, 0] },
        { pivot: '__self__', prop: 'rotation.z', keys: [-0.5, -0.35, -0.15, -0.05, -0.02, 0] }
      ]
    }
  }
});
