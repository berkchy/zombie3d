var plugin = include('registry');

plugin.register({
  id: 'model_pickup_heart',
  name: 'Kalp Modeli',
  type: 'model',
  version: '1.2',
  description: 'Minik tombul pembe kalp',

  createModel() {
    var group = new THREE.Group();

    var heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.08);
    heartShape.bezierCurveTo(-0.06, 0.14, -0.12, 0.08, 0, -0.06);
    heartShape.bezierCurveTo(0.12, 0.08, 0.06, 0.14, 0, 0.08);

    var geo = new THREE.ExtrudeGeometry(heartShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.01,
      bevelThickness: 0.01
    });
    geo.center();

    var mat = new THREE.MeshStandardMaterial({
      color: 0xff4477,
      emissive: 0xff2266,
      emissiveIntensity: 0.5,
      metalness: 0.05,
      roughness: 0.2
    });

    var mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    var shineMat = new THREE.MeshStandardMaterial({
      color: 0xffbbdd,
      emissive: 0xff88bb,
      emissiveIntensity: 0.25,
      metalness: 0,
      roughness: 0.1
    });
    var shineShape = new THREE.Shape();
    shineShape.moveTo(0, 0.04);
    shineShape.bezierCurveTo(-0.025, 0.07, -0.05, 0.035, 0, -0.02);
    shineShape.bezierCurveTo(0.05, 0.035, 0.025, 0.07, 0, 0.04);
    var shineGeo = new THREE.ExtrudeGeometry(shineShape, { depth: 0.002, bevelEnabled: false });
    shineGeo.center();
    var shine = new THREE.Mesh(shineGeo, shineMat);
    shine.position.z = 0.032;
    group.add(shine);

    return group;
  }
});
