var plugin = include('registry');

plugin.register({
  id: 'system_speed',
  name: 'Hiz Sistemi',
  type: 'core',
  version: '1.0',
  description: 'Herhangi bir entity\'nin anlik harita hizini dondurur',
  enabled: true,

  getSpeed(entityId) {
    if (!entityId) return 0;

    var move = plugin.get('system_movement');
    if (move && move.enabled && move._entities && move._entities[entityId]) {
      var e = move._entities[entityId];
      return Math.sqrt(e.velX * e.velX + e.velZ * e.velZ);
    }

    if (entityId === 'player') {
      var pm = plugin.get('player_movement');
      if (pm && pm.enabled) {
        return Math.sqrt((pm.velX || 0) * (pm.velX || 0) + (pm.velZ || 0) * (pm.velZ || 0));
      }
    }

    return 0;
  }
});
