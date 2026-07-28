var plugin = include('registry');
plugin.register({
  id: 'map_moon',
  name: 'Moon',
  type: 'map_model',
  version: '1.0',
  description: 'Moon model — cool blue glow + dim directional light for dark maps',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position ? config.position[0] : 0;
    var cy = config.position ? config.position[1] : 30;
    var cz = config.position ? config.position[2] : 0;

    var core = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xccddee })
    );
    core.position.set(cx, cy, cz);
    group.add(core);

    var crater = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x99aabb, transparent: true, opacity: 0.5 })
    );
    crater.position.set(cx + 0.3, cy + 0.2, cz + 0.4);
    group.add(crater);

    var crater2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x99aabb, transparent: true, opacity: 0.4 })
    );
    crater2.position.set(cx - 0.2, cy - 0.3, cz + 0.3);
    group.add(crater2);

    var glow = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x8899cc, transparent: true, opacity: 0.12 })
    );
    glow.position.set(cx, cy, cz);
    group.add(glow);

    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(4.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x6677aa, transparent: true, opacity: 0.04 })
    );
    halo.position.set(cx, cy, cz);
    group.add(halo);

    var amb = new THREE.AmbientLight(config.ambientColor || 0x334466, config.ambientIntensity || 0.25);
    group.add(amb);

    var hemi = new THREE.HemisphereLight(config.hemiSkyColor || 0x445577, config.hemiGroundColor || 0x222233, config.hemiIntensity || 0.3);
    group.add(hemi);

    var moon = new THREE.DirectionalLight(config.moonColor || 0xaabbdd, config.intensity || 0.6);
    moon.position.set(cx, cy, cz);
    moon.target.position.set(config.targetX || 0, 0, config.targetZ || 0);
    group.add(moon);
    group.add(moon.target);

    if (config.castShadow !== false) {
      moon.castShadow = true;
      moon.shadow.mapSize.width = 1024;
      moon.shadow.mapSize.height = 1024;
      var d = config.shadowSize || 25;
      moon.shadow.camera.left = -d;
      moon.shadow.camera.right = d;
      moon.shadow.camera.top = d;
      moon.shadow.camera.bottom = -d;
      moon.shadow.camera.far = 50;
    }

    return {
      mesh: group,
      colliders: []
    };
  }
});
