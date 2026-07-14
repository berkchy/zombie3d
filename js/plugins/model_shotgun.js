PluginRegistry.register({
  id: 'model_shotgun',
  name: 'Pompali',
  type: 'model',
  version: '1.0',
  description: 'Detayli pompali tufek modeli — player modeline takilir',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    // Receiver (govde)
    var recGeo = new THREE.BoxGeometry(0.07, 0.07, 0.2);
    var recMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 });
    var receiver = new THREE.Mesh(recGeo, recMat);
    receiver.position.set(0, 0.03, 0.05);
    receiver.name = 'receiver';
    group.add(receiver);

    // Barrel (namlu) — uzun
    var barrelGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.45, 8);
    var barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.15 });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, 0.35);
    barrel.name = 'barrel';
    group.add(barrel);

    // Barrel tip
    var tipGeo = new THREE.CylinderGeometry(0.028, 0.024, 0.03, 8);
    var tipMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.2 });
    var tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(0, 0.01, 0.58);
    tip.name = 'barrel_tip';
    group.add(tip);

    // Magazine tube (sarjor tupu) — namlu altinda
    var magTubeGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.35, 8);
    var magTubeMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
    var magTube = new THREE.Mesh(magTubeGeo, magTubeMat);
    magTube.rotation.x = Math.PI / 2;
    magTube.position.set(0, -0.025, 0.3);
    magTube.name = 'mag_tube';
    group.add(magTube);

    // Pump / forend (govde alti, hareketli kisim)
    var pumpGeo = new THREE.BoxGeometry(0.05, 0.03, 0.14);
    var pumpMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.3 });
    var pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.set(0, -0.04, 0.25);
    pump.name = 'pump';
    group.add(pump);

    // Pump alt detay (parmak izi)
    var pumpDetGeo = new THREE.BoxGeometry(0.04, 0.01, 0.1);
    var pumpDetMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var pumpDet = new THREE.Mesh(pumpDetGeo, pumpDetMat);
    pumpDet.position.set(0, -0.055, 0.25);
    pumpDet.name = 'pump_detail';
    group.add(pumpDet);

    // Stock (dipcik)
    var stockGeo = new THREE.BoxGeometry(0.06, 0.1, 0.18);
    var stockMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9, metalness: 0 });
    var stock = new THREE.Mesh(stockGeo, stockMat);
    stock.position.set(0, 0.0, -0.12);
    stock.name = 'stock';
    group.add(stock);

    // Stock rear (dipcik topuk)
    var heelGeo = new THREE.BoxGeometry(0.055, 0.08, 0.04);
    var heelMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 });
    var heel = new THREE.Mesh(heelGeo, heelMat);
    heel.position.set(0, -0.03, -0.23);
    heel.name = 'stock_heel';
    group.add(heel);

    // Grip (tutamak)
    var gripGeo = new THREE.BoxGeometry(0.04, 0.08, 0.04);
    var gripMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9, metalness: 0 });
    var grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.06, 0.0);
    grip.name = 'grip';
    group.add(grip);

    // Grip panel
    var panelGeo = new THREE.BoxGeometry(0.004, 0.06, 0.03);
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 });
    for (var si = -1; si <= 1; si += 2) {
      var pnl = new THREE.Mesh(panelGeo, panelMat);
      pnl.position.set(si * 0.022, -0.06, 0.0);
      group.add(pnl);
    }

    // Trigger guard
    var tgShape = new THREE.Shape();
    tgShape.moveTo(-0.022, -0.015);
    tgShape.quadraticCurveTo(-0.025, -0.05, 0, -0.05);
    tgShape.quadraticCurveTo(0.025, -0.05, 0.022, -0.015);
    var tgGeo = new THREE.ExtrudeGeometry(tgShape, { depth: 0.012, bevelEnabled: false });
    var tgMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5 });
    var tGuard = new THREE.Mesh(tgGeo, tgMat);
    tGuard.position.set(0, 0, 0.05);
    tGuard.rotation.y = Math.PI / 2;
    tGuard.name = 'trigger_guard';
    group.add(tGuard);

    // Trigger
    var trigGeo = new THREE.BoxGeometry(0.008, 0.02, 0.006);
    var trigMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.4 });
    var trigger = new THREE.Mesh(trigGeo, trigMat);
    trigger.position.set(0, -0.015, 0.05);
    trigger.name = 'trigger';
    group.add(trigger);

    // Rear sight
    var rsGeo = new THREE.BoxGeometry(0.025, 0.015, 0.006);
    var rsMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
    var rsight = new THREE.Mesh(rsGeo, rsMat);
    rsight.position.set(0, 0.07, 0.02);
    rsight.name = 'rear_sight';
    group.add(rsight);

    // Front sight
    var fsGeo = new THREE.BoxGeometry(0.012, 0.02, 0.006);
    var fsMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
    var fsight = new THREE.Mesh(fsGeo, fsMat);
    fsight.position.set(0, 0.075, 0.35);
    fsight.name = 'front_sight';
    group.add(fsight);

    return group;
  }
});
