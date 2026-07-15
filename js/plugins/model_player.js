PluginRegistry.register({
  id: 'model_player',
  name: 'Oyuncu',
  type: 'model',
  version: '1.0',
  description: 'Varsayılan oyuncu karakter modeli',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 8);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, roughness: 0.4, metalness: 0.1 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    body.castShadow = true;
    body.name = 'body';
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.6 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.9;
    head.castShadow = true;
    head.name = 'head';
    group.add(head);

    var noseGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
    var noseMat = new THREE.MeshStandardMaterial({ color: 0x0288d1 });
    var nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0.4, 0.5, 0);
    nose.rotation.z = -Math.PI / 2;
    group.add(nose);

    // Silah baglanti noktasi — sag el pozisyonu
    var weaponSlot = new THREE.Object3D();
    weaponSlot.name = 'weapon_slot';
    weaponSlot.position.set(0.5, 0.35, 0.25);
    group.add(weaponSlot);

    group.userData.bodyMat = bodyMat;
    group.userData.headMat = headMat;

    return group;
  }
});
