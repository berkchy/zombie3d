var plugin = include('registry');

plugin.register({
  id: 'entity_ragdoll',
  name: 'Ragdoll Sistemi',
  type: 'core',
  version: '1.1',
  description: 'Entity\'lere ragdoll fizigi saglar — 3. taraf eklentiler kullanir',
  enabled: true,
  priority: 95,

  _ragdolls: null,
  _colliders: [],

  _pivotNames: ['hip', 'torso', 'head', 'legL', 'legR', 'kneeL', 'kneeR', 'shoulderL', 'shoulderR', 'armL', 'armR'],

  init() {
    this._ragdolls = {};
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

  _isInsideCollider(x, z) {
    var cols = this._colliders;
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i];
      if (c.walkable) continue;
      var margin = 0.15;
      if (x + margin >= c.min[0] && x - margin <= c.max[0] &&
          z + margin >= c.min[2] && z - margin <= c.max[2]) {
        return true;
      }
    }
    return false;
  },

  activate(entityMesh, options) {
    if (!entityMesh) return null;
    var id = entityMesh.uuid;
    if (this._ragdolls[id]) return this._ragdolls[id];

    var opts = options || {};
    var velocity = opts.velocity || new THREE.Vector3();
    var duration = opts.duration || 1.5;

    var ragdoll = {
      mesh: entityMesh,
      velocity: velocity.clone(),
      gravity: -12,
      duration: duration,
      timer: 0,
      active: true,
      savedPivots: this._savePivots(entityMesh),
      rotVels: this._initRotVels(entityMesh),
      landed: false
    };

    this._ragdolls[id] = ragdoll;
    return ragdoll;
  },

  deactivate(entityMesh) {
    if (!entityMesh) return;
    var id = entityMesh.uuid;
    var r = this._ragdolls[id];
    if (!r) return;
    this._restorePivots(entityMesh, r.savedPivots);
    delete this._ragdolls[id];
  },

  isActive(entityMesh) {
    return entityMesh && !!this._ragdolls[entityMesh.uuid];
  },

  _savePivots(mesh) {
    var saved = {};
    for (var i = 0; i < this._pivotNames.length; i++) {
      var name = this._pivotNames[i];
      var pivot = mesh.getObjectByName(name);
      if (pivot) {
        saved[name] = {
          rotation: pivot.rotation.clone(),
          position: pivot.position.clone()
        };
      }
    }
    return saved;
  },

  _restorePivots(mesh, saved) {
    for (var name in saved) {
      var pivot = mesh.getObjectByName(name);
      if (pivot && saved[name]) {
        pivot.rotation.copy(saved[name].rotation);
        pivot.position.copy(saved[name].position);
      }
    }
  },

  _initRotVels(mesh) {
    var vels = {};
    for (var i = 0; i < this._pivotNames.length; i++) {
      var name = this._pivotNames[i];
      if (mesh.getObjectByName(name)) {
        vels[name] = {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 5,
          z: (Math.random() - 0.5) * 8
        };
      }
    }
    return vels;
  },

  update(dt) {
    this._loadColliders();

    for (var id in this._ragdolls) {
      var r = this._ragdolls[id];
      if (!r.active) continue;
      r.timer += dt;

      var newX = r.mesh.position.x + r.velocity.x * dt;
      var newZ = r.mesh.position.z + r.velocity.z * dt;

      if (this._isInsideCollider(newX, newZ)) {
        if (!this._isInsideCollider(newX, r.mesh.position.z)) {
          r.velocity.x *= -0.3;
          newX = r.mesh.position.x;
        } else if (!this._isInsideCollider(r.mesh.position.x, newZ)) {
          r.velocity.z *= -0.3;
          newZ = r.mesh.position.z;
        } else {
          r.velocity.x *= -0.5;
          r.velocity.z *= -0.5;
        }
      }

      r.mesh.position.x += r.velocity.x * dt;
      r.mesh.position.z += r.velocity.z * dt;

      r.velocity.y += r.gravity * dt;
      r.mesh.position.y += r.velocity.y * dt;

      if (r.mesh.position.y <= 0) {
        r.mesh.position.y = 0;
        if (r.velocity.y < 0) {
          r.velocity.y *= -0.2;
          if (Math.abs(r.velocity.y) < 0.3) r.velocity.y = 0;
        }
        r.landed = true;
      }

      r.velocity.multiplyScalar(0.96);

      this._updatePose(r, dt);

      if (r.timer >= r.duration) {
        this.deactivate(r.mesh);
      }
    }
  },

  _updatePose(r, dt) {
    var limpNames = ['torso', 'head', 'armL', 'armR', 'legL', 'legR', 'kneeL', 'kneeR'];
    for (var i = 0; i < limpNames.length; i++) {
      var pivot = r.mesh.getObjectByName(limpNames[i]);
      if (!pivot) continue;
      var vel = r.rotVels[limpNames[i]];
      if (!vel) continue;

      pivot.rotation.x += vel.x * dt;
      pivot.rotation.y += vel.y * dt;
      pivot.rotation.z += vel.z * dt;

      vel.x *= 0.97;
      vel.y *= 0.97;
      vel.z *= 0.97;

      if (!r.landed) {
        vel.x += (Math.random() - 0.5) * 4 * dt;
        vel.y += (Math.random() - 0.5) * 2 * dt;
        vel.z += (Math.random() - 0.5) * 4 * dt;
      }
    }

    var hip = r.mesh.getObjectByName('hip');
    if (hip && r.velocity.lengthSq() > 0.1) {
      var angle = Math.atan2(r.velocity.x, r.velocity.z);
      hip.rotation.y += (angle - hip.rotation.y) * 0.08;
      hip.rotation.x += (r.velocity.z * 0.03 - hip.rotation.x) * 0.08;
    }
  },

  destroy() {
    for (var id in this._ragdolls) {
      var r = this._ragdolls[id];
      if (r && r.mesh) this._restorePivots(r.mesh, r.savedPivots);
    }
    this._ragdolls = null;
  }
});
