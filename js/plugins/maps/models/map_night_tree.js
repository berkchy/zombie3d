var plugin = include('registry');
plugin.register({
  id: 'map_night_tree',
  name: 'Kuru Agac',
  type: 'map_model',
  version: '2.0',
  description: 'Kuru olmus agac — siluet, gece atmosferi',
  createModel: function(config) {
    var group = new THREE.Group();
    var cx = config.position[0];
    var cy = config.position[1] || 0;
    var cz = config.position[2];
    var s = config.scale || 1;

    var barkMat = new THREE.MeshStandardMaterial({ color: config.color || 0x3a3a3a, roughness: 0.95 });

    function branch(x, y, z, rx, ry, rz, length, thick, dX, dZ) {
      var b = new THREE.Mesh(
        new THREE.CylinderGeometry(thick * 0.4, thick, length, 5),
        barkMat
      );
      b.position.set(cx + x + dX * length * 0.3, cy + y + length * 0.5, cz + z + dZ * length * 0.3);
      b.rotation.set(rx, ry, rz);
      b.castShadow = true;
      group.add(b);
      return b;
    }

    // Ana govde (trunk)
    var trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03 * s, 0.07 * s, 1.0 * s, 7),
      barkMat
    );
    trunk.position.set(cx, cy + 0.5 * s, cz);
    trunk.castShadow = true;
    group.add(trunk);

    // Dal 1: sag yukari (0.7 hizasinda, saga 20 derece)
    branch(0, 0.65*s, 0, 0.0, 0.0, 0.2, 0.5*s, 0.025*s, 0.15*s, 0.05*s);
    // Dal 1 alt kolu
    branch(0.12*s, 0.7*s, 0.04*s, -0.1, 0.0, 0.4, 0.3*s, 0.015*s, 0.12*s, -0.02*s);
    // Dal 1 ufak dal
    branch(0.2*s, 0.75*s, 0.02*s, 0.2, 0.0, 0.6, 0.15*s, 0.01*s, 0.08*s, 0.03*s);

    // Dal 2: sol yukari
    branch(0, 0.55*s, 0, -0.1, 0.0, -0.25, 0.4*s, 0.022*s, -0.12*s, 0.06*s);
    branch(-0.1*s, 0.6*s, 0.05*s, 0.15, 0.0, -0.35, 0.25*s, 0.012*s, -0.1*s, -0.02*s);

    // Dal 3: sag orta
    branch(0, 0.4*s, 0, 0.1, 0.0, 0.35, 0.35*s, 0.02*s, 0.1*s, -0.08*s);
    branch(0.08*s, 0.45*s, -0.06*s, 0.0, 0.0, 0.5, 0.2*s, 0.012*s, 0.08*s, 0.02*s);

    // Dal 4: sol orta
    branch(0, 0.35*s, 0, -0.05, 0.0, -0.4, 0.3*s, 0.018*s, -0.1*s, -0.05*s);
    branch(-0.08*s, 0.38*s, -0.04*s, 0.1, 0.0, -0.55, 0.18*s, 0.01*s, -0.06*s, 0.04*s);

    // Dal 5: sag alt
    branch(0, 0.2*s, 0, -0.15, 0.0, 0.5, 0.25*s, 0.018*s, 0.08*s, 0.1*s);

    // Dal 6: sol alt
    branch(0, 0.15*s, 0, 0.1, 0.0, -0.55, 0.2*s, 0.015*s, -0.06*s, -0.08*s);

    return {
      mesh: group,
      colliders: ColliderHelper.extractColliders(group)
    };
  }
});
