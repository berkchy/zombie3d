var plugin = include('registry');
plugin.register({
  id: 'map_sun',
  name: 'Sun',
  type: 'map_model',
  version: '1.0',
  description: 'Sun model — glow + directional light',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position ? config.position[0] : 0;
    var cy = config.position ? config.position[1] : 30;
    var cz = config.position ? config.position[2] : 0;

    var core = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffee88 })
    );
    core.position.set(cx, cy, cz);
    group.add(core);

    var glow = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.15 })
    );
    glow.position.set(cx, cy, cz);
    group.add(glow);

    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff8822, transparent: true, opacity: 0.05 })
    );
    halo.position.set(cx, cy, cz);
    group.add(halo);

    var amb = new THREE.AmbientLight(0x8899bb, config.ambientIntensity || 0.5);
    group.add(amb);

    var hemi = new THREE.HemisphereLight(0x88ccff, 0x444422, config.hemiIntensity || 0.7);
    group.add(hemi);

    var sun = new THREE.DirectionalLight(0xffeedd, config.intensity || 1.8);
    sun.position.set(cx, cy, cz);
    sun.target.position.set(config.targetX || 0, 0, config.targetZ || 0);
    group.add(sun);
    group.add(sun.target);

    if (config.castShadow !== false) {
      sun.castShadow = true;
      sun.shadow.mapSize.width = 2048;
      sun.shadow.mapSize.height = 2048;
      var d = config.shadowSize || 30;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
      sun.shadow.camera.far = 60;
    }

    return {
      mesh: group,
      colliders: []
    };
  }
});