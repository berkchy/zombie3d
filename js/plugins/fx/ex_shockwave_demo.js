var plugin = include('registry');

// ORNEK — WaveThink ile mantik, fx_shockwave.shockwave() ile gorsel
plugin.register({
  id: 'ex_shockwave_demo',
  name: 'Shockwave Demo',
  type: 'core',
  version: '1.0',
  enabled: true,

  init(game) {
    // Zombi olunce: gorsel dalga + ayri think (mantik icin)
    plugin.on('zombie:die', this.id, function(pos) {
      var sw = plugin.get('fx_shockwave');
      if (sw && sw.shockwave) {
        sw.shockwave(pos, { maxRadius: 4, height: 0.5, duration: 1.0, color: 0xff6644 });
      }

      new WaveThink('push_' + Date.now(), {
        duration: 1.0, maxRadius: 4, position: pos
      });
    });

    // Dalga cephesindeki entity'leri ittir
    plugin.on('shockwave:expand', this.id + '_push', function(e) {
      var entities = plugin.getByType('entity');
      for (var i = 0; i < entities.length; i++) {
        var ent = entities[i];
        var dx = ent.x - e.position.x;
        var dz = ent.z - e.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (Math.abs(dist - e.radius) < 0.8) {
          var fx = Math.atan2(dz, dx);
          ent.vx = (ent.vx || 0) + Math.cos(fx) * 3;
          ent.vz = (ent.vz || 0) + Math.sin(fx) * 3;
        }
      }
    });
  },

  destroy() {
    plugin.off('zombie:die', this.id);
    plugin.off('shockwave:expand', this.id + '_push');
  }
});
