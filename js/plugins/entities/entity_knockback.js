var plugin = include('registry');

plugin.register({
  id: 'entity_knockback',
  name: 'Darbe Geri-Tepme',
  type: 'core',
  version: '1.0',
  description: 'Entity\'lere silah/patlama knokback uygular + ragdoll tetikler',
  enabled: true,
  priority: 94,

  maxDistance: 10,

  init() {},

  knockbackMultipliers: {
    head: 2.0,
    chest: 1.0,
    arm: 0.6,
    leg: 0.5,
    foot: 0.3
  },

  applyAt(entityMesh, origin, knockbackForce, direction, weight, maxDistance, hitType) {
    if (!entityMesh || !origin || !knockbackForce) return;

    weight = weight || this._getWeight(entityMesh);
    maxDistance = maxDistance || this.maxDistance;
    var dist = entityMesh.position.distanceTo(origin);
    if (dist > maxDistance) return;

    var falloff = 1 - (dist / maxDistance);
    falloff = Math.max(falloff, 0.05);
    var bodyMult = this.knockbackMultipliers[hitType] || 1.0;
    var force = (knockbackForce || 50) / (weight || 70) * falloff * bodyMult;

    var dir = direction ? direction.clone() : new THREE.Vector3().copy(entityMesh.position).sub(origin).normalize();
    dir.y = 0.6;
    var velocity = dir.multiplyScalar(force * 2.0);

    if (velocity.length() < 0.5) return;

    var ragdoll = plugin.get('entity_ragdoll');
    if (ragdoll && ragdoll.enabled) {
      ragdoll.activate(entityMesh, {
        velocity: velocity,
        duration: Math.min(1.2 + force * 0.4, 2.5)
      });
    }
  },

  applyAtPosition(position, radius, knockbackForce) {
    if (!position) return;
    var maxDist = (radius > 0) ? radius : this.maxDistance;
    var entities = this._getEnemies();

    for (var i = 0; i < entities.length; i++) {
      var e = entities[i];
      if (!e.alive || e.dying) continue;
      var dist = e.mesh.position.distanceTo(position);
      if (dist > maxDist) continue;
      var dir = new THREE.Vector3().copy(e.mesh.position).sub(position).normalize();
      this.applyAt(e.mesh, position, knockbackForce, dir);
    }
  },

  _getEnemies() {
    var all = [];
    var zb = plugin.get('zombie_basic');
    if (zb && zb.enabled && zb.zombies) {
      for (var i = 0; i < zb.zombies.length; i++) {
        if (zb.zombies[i].alive) all.push(zb.zombies[i]);
      }
    }
    var boss = plugin.get('zombie_boss');
    if (boss && boss.enabled && boss.boss && boss.boss.alive) {
      all.push(boss.boss);
    }
    return all;
  },

  _getWeight(entityMesh) {
    if (!entityMesh) return 70;
    if (entityMesh.getObjectByName('chestPlate')) return 200;
    return 70;
  },

  destroy() {}
});
