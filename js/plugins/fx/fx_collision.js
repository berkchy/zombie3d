var plugin = include('registry');

plugin.register({
  id: 'fx_collision',
  name: 'Carpisma Engeli',
  type: 'fx',
  version: '1.0',
  description: 'Oyuncu ve zombilerin ic ice gecmesini engeller',
  priority: 99,
  enabled: true,

  playerRadius: 0.45,
  zombieRadius: 0.4,

  update(dt) {
    if (!game || !game.player || !game.playerMesh) return;

    var zombiePlugin = plugin.get('zombie_basic');
    if (!zombiePlugin || !zombiePlugin.enabled) return;

    var zombies = zombiePlugin.zombies;
    if (!zombies || zombies.length === 0) return;

    var playerMesh = game.playerMesh;
    var playerPos = playerMesh.position;

    // 1) Oyuncu vs zombi — oyuncu itilmez, zombi itilir
    var pMinDist = this.playerRadius + this.zombieRadius;
    for (var i = 0; i < zombies.length; i++) {
      var z = zombies[i];
      if (!z || !z.alive || !z.mesh) continue;

      var dx = playerPos.x - z.mesh.position.x;
      var dz = playerPos.z - z.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < pMinDist && dist > 0.001) {
        var overlap = pMinDist - dist;
        var nx = dx / dist;
        var nz = dz / dist;
        z.mesh.position.x -= nx * overlap;
        z.mesh.position.z -= nz * overlap;
      }
    }

    // 2) Zombi vs zombi
    var zMinDist = this.zombieRadius * 2;
    for (var i = 0; i < zombies.length; i++) {
      var a = zombies[i];
      if (!a || !a.alive || !a.mesh) continue;

      for (var j = i + 1; j < zombies.length; j++) {
        var b = zombies[j];
        if (!b || !b.alive || !b.mesh) continue;

        var dx = a.mesh.position.x - b.mesh.position.x;
        var dz = a.mesh.position.z - b.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < zMinDist && dist > 0.001) {
          var overlap = zMinDist - dist;
          var nx = dx / dist;
          var nz = dz / dist;
          var push = overlap * 0.5;
          a.mesh.position.x += nx * push;
          a.mesh.position.z += nz * push;
          b.mesh.position.x -= nx * push;
          b.mesh.position.z -= nz * push;
        }
      }
    }
  }
});
