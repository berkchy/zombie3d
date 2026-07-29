var plugin = include('registry');
plugin.register({
  id: 'map_night_brazier',
  name: 'Ates Ocagi',
  type: 'map_model',
  version: '1.0',
  description: 'Büyük ates ocagi — kor + isil + isi kaynagi',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];

    var standMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7, metalness: 0.4 });
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.0, 8), standMat);
    pole.position.set(cx, cy + 0.5, cz);
    pole.castShadow = true;
    group.add(pole);

    var bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.12, 10), standMat);
    bowl.position.set(cx, cy + 1.06, cz);
    bowl.castShadow = true;
    group.add(bowl);

    var coalMat = new THREE.MeshStandardMaterial({ color: 0x442200, emissive: 0xff4400, emissiveIntensity: 0.3 });
    var coal = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), coalMat);
    coal.position.set(cx, cy + 1.12, cz);
    coal.scale.set(1, 0.4, 1);
    group.add(coal);

    var fireMat = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff4400, emissiveIntensity: 0.8 });
    var fire = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), fireMat);
    fire.position.set(cx, cy + 1.18, cz);
    fire.scale.set(1, 1.5, 1);
    group.add(fire);

    var glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.08, depthWrite: false });
    var glow = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 10), glowMat);
    glow.position.set(cx, cy + 1.2, cz);
    group.add(glow);

    var pl = new THREE.PointLight(0xff6600, 0.8, 10);
    pl.position.set(cx, cy + 1.3, cz);
    group.add(pl);

    var heatPos = new THREE.Vector3(cx, cy + 1.3, cz);
    try { var pp = plugin.get('gfx_postprocessing'); if (pp && pp.addHeatSource) pp.addHeatSource(heatPos); } catch(e) {}

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});
