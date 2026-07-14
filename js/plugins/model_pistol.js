PluginRegistry.register({
  id: 'model_pistol',
  name: 'Tabanca',
  type: 'model',
  version: '1.0',
  description: 'Detayli tabanca modeli — player modeline takilir',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    // Ana govde (slide)
    var slideGeo = new THREE.BoxGeometry(0.06, 0.06, 0.22);
    var slideMat = new THREE.MeshStandardMaterial({ color: 0x7788aa, metalness: 0.7, roughness: 0.3 });
    var slide = new THREE.Mesh(slideGeo, slideMat);
    slide.position.set(0, 0.04, 0.18);
    slide.name = 'slide';
    group.add(slide);

    // Barrel (namlu)
    var barrelGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.18, 8);
    var barrelMat = new THREE.MeshStandardMaterial({ color: 0x667799, metalness: 0.8, roughness: 0.2 });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, 0.3);
    barrel.name = 'barrel';
    group.add(barrel);

    // Barrel front (namlu agzi)
    var frontGeo = new THREE.CylinderGeometry(0.032, 0.028, 0.03, 8);
    var frontMat = new THREE.MeshStandardMaterial({ color: 0x556688, metalness: 0.9, roughness: 0.2 });
    var front = new THREE.Mesh(frontGeo, frontMat);
    front.rotation.x = Math.PI / 2;
    front.position.set(0, 0.015, 0.4);
    front.name = 'front';
    group.add(front);

    // Grips
    var gripGeo = new THREE.BoxGeometry(0.04, 0.12, 0.06);
    var gripMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9, metalness: 0 });
    var grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.06, 0.05);
    grip.name = 'grip';
    group.add(grip);

    // Grip panel (texture detail)
    var panelGeo = new THREE.BoxGeometry(0.005, 0.08, 0.04);
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 });
    for (var side = -1; side <= 1; side += 2) {
      var panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(side * 0.022, -0.06, 0.05);
      group.add(panel);
    }

    // Trigger guard
    var guardShape = new THREE.Shape();
    guardShape.moveTo(-0.02, -0.025);
    guardShape.quadraticCurveTo(-0.025, -0.06, 0, -0.06);
    guardShape.quadraticCurveTo(0.025, -0.06, 0.02, -0.025);
    var guardGeo = new THREE.ExtrudeGeometry(guardShape, { depth: 0.015, bevelEnabled: false });
    var guardMat = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.5, roughness: 0.4 });
    var guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.set(0, 0, 0.1);
    guard.rotation.y = Math.PI / 2;
    guard.name = 'trigger_guard';
    group.add(guard);

    // Trigger (cakmak)
    var trigGeo = new THREE.BoxGeometry(0.01, 0.025, 0.008);
    var trigMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.6, roughness: 0.3 });
    var trigger = new THREE.Mesh(trigGeo, trigMat);
    trigger.position.set(0, -0.02, 0.1);
    trigger.name = 'trigger';
    group.add(trigger);

    // Magazine (sarjor)
    var magGeo = new THREE.BoxGeometry(0.03, 0.06, 0.04);
    var magMat = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.6, roughness: 0.4 });
    var mag = new THREE.Mesh(magGeo, magMat);
    mag.position.set(0, -0.12, 0.05);
    mag.name = 'magazine';
    group.add(mag);

    // Hammer (horoz)
    var hammerGeo = new THREE.BoxGeometry(0.02, 0.025, 0.01);
    var hammerMat = new THREE.MeshStandardMaterial({ color: 0x667788, metalness: 0.5, roughness: 0.4 });
    var hammer = new THREE.Mesh(hammerGeo, hammerMat);
    hammer.position.set(0, 0.05, 0.06);
    hammer.name = 'hammer';
    group.add(hammer);

    // Rear sight (arka gez)
    var sightGeo = new THREE.BoxGeometry(0.02, 0.015, 0.008);
    var sightMat = new THREE.MeshStandardMaterial({ color: 0x99aabb, metalness: 0.9 });
    var sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(0, 0.07, 0.07);
    sight.name = 'rear_sight';
    group.add(sight);

    // Front sight (on gez)
    var fsight = sight.clone();
    fsight.position.set(0, 0.07, 0.3);
    fsight.name = 'front_sight';
    group.add(fsight);

    return group;
  }
});
