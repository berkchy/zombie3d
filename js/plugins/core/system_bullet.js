var plugin = include('registry');

plugin.register({
  id: 'system_bullet',
  name: 'Mermi Sistemi',
  type: 'core',
  version: '1.1',
  description: 'Tüm mermi fiziği, hedef testi ve collider engeli',

  _bullets: null,
  _colliders: [],

  init() {
    this._bullets = [];
    this._colliders = [];
  },

  _loadColliders() {
    this._colliders = [];
    if (!game || !game.currentMap) return;
    var mapPluginId = 'map_' + game.currentMap.id;
    var map = plugin.get(mapPluginId);
    if (map && typeof map.getColliders === 'function') {
      try { this._colliders = map.getColliders() || []; } catch (e) {}
    }
  },

  _pointInCollider(x, y, z) {
    var cols = this._colliders;
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i];
      if (c.walkable) continue;
      if (x >= c.min[0] && x <= c.max[0] &&
          y >= c.min[1] && y <= c.max[1] &&
          z >= c.min[2] && z <= c.max[2]) {
        return true;
      }
    }
    return false;
  },

  spawn(config) {
    this._loadColliders();

    var count = config.count || 1;
    var baseDir = config.direction.clone().normalize();
    var spread = config.spread || 0;

    for (var i = 0; i < count; i++) {
      var dir = baseDir.clone();
      if (spread > 0) {
        var spreadH = (Math.random() - 0.5) * spread * 2;
        var spreadV = (Math.random() - 0.5) * spread * 2;
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadH);
        dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), spreadV);
        dir.normalize();
      }
      this._bullets.push({
        pos: config.position.clone(),
        dir: dir,
        speed: config.speed || 500,
        damage: config.damage || 25,
        knockback: config.knockback || 0,
        knockbackDistance: config.knockbackDistance || 10,
        life: config.life || 2.0,
        size: config.size || 0.05
      });
    }
  },

  update(dt) {
    var enemies = plugin.getByType('zombie');
    var toRemove = [];
    var hitCount = 0;

    for (var i = 0; i < this._bullets.length; i++) {
      var b = this._bullets[i];
      b.life -= dt;
      if (b.life <= 0) { toRemove.push(i); continue; }

      var total = b.speed * dt;
      var step = 0.2;
      var remaining = total;
      var hit = false;

      while (remaining > 0) {
        var stepSize = Math.min(step, remaining);
        b.pos.x += b.dir.x * stepSize;
        b.pos.y += b.dir.y * stepSize;
        b.pos.z += b.dir.z * stepSize;
        remaining -= stepSize;

        if (this._pointInCollider(b.pos.x, b.pos.y, b.pos.z)) {
          plugin.emit('bullet:impact', { position: b.pos.clone(), type: 'wall' });
          toRemove.push(i);
          hit = true;
          break;
        }

        if (Math.abs(b.pos.x) > 28 || Math.abs(b.pos.z) > 28) {
          toRemove.push(i);
          hit = true;
          break;
        }

        for (var e = 0; e < enemies.length; e++) {
          if (enemies[e].enabled && typeof enemies[e].hitTest === 'function' && enemies[e].hitTest(b.pos, b.size, b.damage, { knockback: b.knockback || 0, knockbackDistance: b.knockbackDistance || 10, direction: b.dir })) {
            if (enemies[e].id !== 'zombie_boss') {
              plugin.emit('bullet:hit', { position: b.pos.clone() });
            }
            plugin.emit('bullet:impact', { position: b.pos.clone(), type: 'flesh' });
            toRemove.push(i);
            hit = true;
            break;
          }
        }
        if (hit) break;
      }

      if (hit) hitCount++;
    }

    if (toRemove.length > hitCount) {
      plugin.emit('system_bullet:miss', { count: toRemove.length - hitCount });
    }

    for (var i = toRemove.length - 1; i >= 0; i--) {
      this._bullets.splice(toRemove[i], 1);
    }
  },

  destroy() {
    this._bullets = [];
    this._colliders = [];
  }
});
