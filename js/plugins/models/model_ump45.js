var plugin = include('registry');

plugin.register({
  id: 'model_ump45',
  name: 'UMP45',
  type: 'model',
  version: '2.0',
  description: 'HK UMP45 — detayli SMG modeli',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    // Malzemeler
    var upperMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 });
    var lowerMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.8, metalness: 0.1 });
    var barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.15 });
    var gripMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95, metalness: 0 });
    var railMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.3 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4, roughness: 0.5 });
    var accMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.3 });

    // === UPPER RECEIVER ===
    var upper = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.038, 0.18), upperMat);
    upper.position.set(0, 0.025, 0.04);
    upper.name = 'upper_receiver';
    group.add(upper);

    // Rear receiver — arkaya dogru daralan kismi
    var rearRecv = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), upperMat);
    rearRecv.position.set(0, 0.03, -0.06);
    rearRecv.name = 'rear_receiver';
    group.add(rearRecv);

    // Receiver rear slope (kama)
    var recvSlope = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.015, 0.025), upperMat);
    recvSlope.position.set(0, 0.045, -0.07);
    recvSlope.rotation.x = -0.35;
    recvSlope.name = 'receiver_slope';
    group.add(recvSlope);

    // === LOWER RECEIVER ===
    var lower = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.025, 0.13), lowerMat);
    lower.position.set(0, 0.005, 0.04);
    lower.name = 'lower_receiver';
    group.add(lower);

    // Lower rear — grip gecis bolgesi
    var lowerRear = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.018, 0.04), lowerMat);
    lowerRear.position.set(0, -0.002, -0.04);
    lowerRear.name = 'lower_rear';
    group.add(lowerRear);

    // === TOP PICATINNY RAIL ===
    for (var ri = 0; ri < 8; ri++) {
      var rPos = 0.08 + ri * 0.018;
      var seg = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.004, 0.012), railMat);
      seg.position.set(0, 0.053, rPos);
      seg.name = 'rail_seg_' + ri;
      group.add(seg);
    }

    // Rear sight base
    var rearSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.012, 0.008), darkMat);
    rearSightBase.position.set(0, 0.058, -0.025);
    rearSightBase.name = 'rear_sight_base';
    group.add(rearSightBase);

    // Rear sight ears
    for (var si = -1; si <= 1; si += 2) {
      var ear = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.02, 0.006), darkMat);
      ear.position.set(si * 0.009, 0.066, -0.025);
      ear.name = 'rear_sight_ear_' + (si > 0 ? 'r' : 'l');
      group.add(ear);
    }

    // Rear sight aperture
    var ap = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.006, 0.002), darkMat);
    ap.position.set(0, 0.066, -0.028);
    ap.name = 'rear_aperture';
    group.add(ap);

    // === BARREL ===
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.16, 8), barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, 0.24);
    barrel.name = 'barrel';
    group.add(barrel);

    // Barrel extension / chamber
    var barrelExt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.025, 8), barrelMat);
    barrelExt.rotation.x = Math.PI / 2;
    barrelExt.position.set(0, 0.015, 0.155);
    barrelExt.name = 'barrel_ext';
    group.add(barrelExt);

    // Flash hider — 3-slot
    var fh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.04, 8), barrelMat);
    fh.rotation.x = Math.PI / 2;
    fh.position.set(0, 0.015, 0.33);
    fh.name = 'flash_hider';
    group.add(fh);

    // Flash hider slots
    for (var fi = -1; fi <= 1; fi += 2) {
      var fSlot = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.018, 0.015), darkMat);
      fSlot.position.set(fi * 0.014, 0.015, 0.33);
      fSlot.name = 'fh_slot_' + (fi > 0 ? 'r' : 'l');
      group.add(fSlot);
    }

    // === HANDGUARD ===
    var hg = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.032, 0.1), upperMat);
    hg.position.set(0, 0.005, 0.16);
    hg.name = 'handguard';
    group.add(hg);

    // Handguard heat shield holes
    for (var hi = 0; hi < 4; hi++) {
      var hHole = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.028, 0.003), darkMat);
      hHole.position.set(0, 0.005, 0.125 + hi * 0.022);
      hHole.name = 'hg_hole_' + hi;
      group.add(hHole);
    }

    // Handguard bottom rail
    var hgBotRail = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.005, 0.07), railMat);
    hgBotRail.position.set(0, -0.015, 0.16);
    hgBotRail.name = 'hg_bot_rail';
    group.add(hgBotRail);

    // Handguard side rails
    for (var sri = -1; sri <= 1; sri += 2) {
      var sRail = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.02, 0.06), railMat);
      sRail.position.set(sri * 0.024, 0.005, 0.16);
      sRail.name = 'hg_side_rail_' + (sri > 0 ? 'r' : 'l');
      group.add(sRail);
    }

    // === PISTOL GRIP ===
    var gripShape = new THREE.Shape();
    gripShape.moveTo(-0.016, 0);
    gripShape.lineTo(0.016, 0);
    gripShape.lineTo(0.014, 0.055);
    gripShape.lineTo(0.008, 0.075);
    gripShape.lineTo(0, 0.085);
    gripShape.lineTo(-0.008, 0.075);
    gripShape.lineTo(-0.014, 0.055);
    gripShape.closePath();
    var gripGeo = new THREE.ExtrudeGeometry(gripShape, { depth: 0.022, bevelEnabled: false });
    var grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.035, 0.02);
    grip.rotation.y = Math.PI / 2;
    grip.name = 'grip';
    group.add(grip);

    // Grip texture lines
    for (var gi = 0; gi < 5; gi++) {
      var gl = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.0015, 0.002), railMat);
      gl.position.set(0, -0.060 + gi * 0.012, 0.028);
      gl.rotation.x = 0.15;
      gl.name = 'grip_line_' + gi;
      group.add(gl);
    }

    // Grip cap
    var gripCap = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.004, 0.018), lowerMat);
    gripCap.position.set(0, -0.078, 0.025);
    gripCap.name = 'grip_cap';
    group.add(gripCap);

    // === TRIGGER GUARD ===
    var tgShape = new THREE.Shape();
    tgShape.moveTo(-0.016, -0.01);
    tgShape.quadraticCurveTo(-0.02, -0.038, 0, -0.042);
    tgShape.quadraticCurveTo(0.02, -0.038, 0.016, -0.01);
    var tgGeo = new THREE.ExtrudeGeometry(tgShape, { depth: 0.01, bevelEnabled: false });
    var tGuard = new THREE.Mesh(tgGeo, accMat);
    tGuard.position.set(0, 0.005, 0.07);
    tGuard.rotation.y = Math.PI / 2;
    tGuard.name = 'trigger_guard';
    group.add(tGuard);

    // Trigger
    var trigger = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.016, 0.004), accMat);
    trigger.position.set(0, -0.008, 0.08);
    trigger.name = 'trigger';
    group.add(trigger);

    // === MAGAZINE ===
    var mag = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.085, 0.018), lowerMat);
    mag.position.set(0, -0.055, 0.045);
    mag.rotation.x = 0.08;
    mag.name = 'magazine';
    group.add(mag);

    // Magazine front curve (hafif eğim)
    var magFront = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.055, 0.016), lowerMat);
    magFront.position.set(0, -0.07, 0.048);
    magFront.rotation.x = 0.12;
    magFront.name = 'mag_front';
    group.add(magFront);

    // Magazine floor plate
    var magBase = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.005, 0.022), gripMat);
    magBase.position.set(0, -0.098, 0.045);
    magBase.rotation.x = 0.08;
    magBase.name = 'mag_base';
    group.add(magBase);

    // Magazine catch
    var magCatch = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.007, 0.004), accMat);
    magCatch.position.set(0.022, -0.005, 0.065);
    magCatch.name = 'mag_catch';
    group.add(magCatch);

    // === CHARGING HANDLE (sol) ===
    var chHandle = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.008, 0.022), barrelMat);
    chHandle.position.set(-0.027, 0.035, 0.13);
    chHandle.name = 'charging_handle';
    group.add(chHandle);

    var chKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.006, 6), barrelMat);
    chKnob.position.set(-0.03, 0.035, 0.13);
    chKnob.name = 'charging_knob';
    group.add(chKnob);

    // === EJECTION PORT (sag) ===
    var ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.016, 0.035), darkMat);
    ejPort.position.set(0.024, 0.032, 0.07);
    ejPort.name = 'ejection_port';
    group.add(ejPort);

    // Ejection port outline
    var ejOutline = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.018, 0.04), barrelMat);
    ejOutline.position.set(0.025, 0.032, 0.07);
    ejOutline.name = 'ejection_outline';
    group.add(ejOutline);

    // === BOLT CATCH (sol) ===
    var boltCatch = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.006), accMat);
    boltCatch.position.set(-0.026, 0.02, 0.065);
    boltCatch.name = 'bolt_catch';
    group.add(boltCatch);

    // === SELECTOR SWITCH (sol) ===
    var selSwitch = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.006, 0.008), accMat);
    selSwitch.position.set(-0.026, 0.012, 0.045);
    selSwitch.name = 'selector_switch';
    group.add(selSwitch);

    // === STOCK ===
    // Stock buffer tube
    var bufferTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.08, 8), barrelMat);
    bufferTube.rotation.x = Math.PI / 2;
    bufferTube.position.set(0, 0.02, -0.1);
    bufferTube.name = 'buffer_tube';
    group.add(bufferTube);

    // Stock body — UMP collapsible stock tarzi
    var stockBody = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.08), lowerMat);
    stockBody.position.set(0, 0.02, -0.16);
    stockBody.name = 'stock_body';
    group.add(stockBody);

    // Stock cheek rest
    var cheek = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.012, 0.06), gripMat);
    cheek.position.set(0, 0.038, -0.15);
    cheek.name = 'cheek_rest';
    group.add(cheek);

    // Stock butt plate
    var buttPlate = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.008), gripMat);
    buttPlate.position.set(0, 0.015, -0.205);
    buttPlate.name = 'butt_plate';
    group.add(buttPlate);

    // Stock buffer tube top (tube ile stockBody arasi metal)
    var tubeConn = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.011, 0.04, 8), barrelMat);
    tubeConn.rotation.x = Math.PI / 2;
    tubeConn.position.set(0, 0.02, -0.14);
    tubeConn.name = 'tube_connector';
    group.add(tubeConn);

    // === FRONT SIGHT ===
    var frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.022, 0.004), darkMat);
    frontSight.position.set(0, 0.056, 0.205);
    frontSight.name = 'front_sight';
    group.add(frontSight);

    // Front sight ears
    for (var fi2 = -1; fi2 <= 1; fi2 += 2) {
      var fEar = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.016, 0.003), darkMat);
      fEar.position.set(fi2 * 0.006, 0.048, 0.205);
      fEar.name = 'front_sight_ear_' + (fi2 > 0 ? 'r' : 'l');
      group.add(fEar);
    }

    // === BARREL TIP ===
    var tip = new THREE.Object3D();
    tip.position.set(0, 0.015, 0.36);
    tip.name = 'barrel_tip';
    group.add(tip);

    return group;
  },

  animations: {
    idle: {
      duration: 3.0,
      loop: true,
      tracks: [
        { pivot: '__self__', prop: 'position.y', keys: [0, 0.002, -0.001, -0.002, 0] },
        { pivot: '__self__', prop: 'position.x', keys: [0, -0.001, 0.001, 0.001, 0] }
      ]
    },
    fire: {
      duration: 0.15,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.z', keys: [0, 0.04, 0.008, 0] },
        { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.08, -0.01, 0] }
      ]
    },
    reload: {
      duration: 2.0,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.y', keys: [0, -0.05, -0.08, -0.08, -0.02, 0] },
        { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.12, 0.12, 0.08, 0.02, 0] },
        { pivot: '__self__', prop: 'rotation.z', keys: [0, -0.25, -0.25, -0.15, -0.05, 0] },
        { pivot: 'magazine', prop: 'position.y', keys: [-0.055, -0.055, -0.18, -0.18, -0.055, -0.055] },
        { pivot: 'magazine', prop: 'position.z', keys: [0.045, 0.045, 0.08, 0.08, 0.045, 0.045] }
      ]
    },
    equip: {
      duration: 1.2,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.y', keys: [-0.5, -0.25, -0.05, 0] },
        { pivot: '__self__', prop: 'position.z', keys: [0.25, 0.12, 0.02, 0] },
        { pivot: '__self__', prop: 'position.x', keys: [0.04, 0.015, 0, 0] }
      ]
    }
  }
});
