PluginRegistry.register({
  id: 'model_zombie',
  name: 'Zombi',
  type: 'model',
  version: '1.0',
  description: 'Standart yeşil zombi modeli',
  enabled: true,

  createModel() {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.7, 6);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.8 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.25, 6, 6);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x6b8e5a, roughness: 0.8 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.8;
    head.castShadow = true;
    group.add(head);

    var eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 });
    for (var si = 0; si < 2; si++) {
      var side = si === 0 ? -1 : 1;
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eyeMat);
      eye.position.set(0.1 * side, 0.82, -0.2);
      group.add(eye);
    }

    return group;
  }
});
