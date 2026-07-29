var plugin = include('registry');

plugin.register({
  id: 'system_movement',
  name: 'Hareket Fiziği',
  type: 'core',
  version: '1.0',
  description: 'Entity hareket yönetimi — collision, step-up, hedef takibi',

  _entities: null,

  init() {
    this._entities = {};
    this._v3 = new THREE.Vector3();

    var self = this;
    plugin.on('movement:register', this.id, function(data) {
      if (!data || !data.entityId || !data.mesh) return;
      self._entities[data.entityId] = {
        mesh: data.mesh,
        speed: data.speed || 2,
        radius: data.radius || 0.3,
        canMove: data.canMove !== false,
        target: null,
        velX: 0,
        velZ: 0,
        y: 0
      };
    });

    plugin.on('movement:unregister', this.id, function(data) {
      if (data && data.entityId) delete self._entities[data.entityId];
    });

    plugin.on('movement:move_to', this.id, function(data) {
      if (!data || !data.entityId) return;
      var e = self._entities[data.entityId];
      if (!e) return;
      e.target = data.target;
      e.accel = data.accel || 15;
      e.friction = data.friction || 10;
      if (data.speed !== undefined) e.speed = data.speed;
    });

    plugin.on('movement:stop', this.id, function(data) {
      if (!data || !data.entityId) return;
      var e = self._entities[data.entityId];
      if (!e) return;
      e.target = null;
    });

    plugin.on('movement:set_speed', this.id, function(data) {
      if (!data || !data.entityId) return;
      var e = self._entities[data.entityId];
      if (!e) return;
      if (data.speed !== undefined) e.speed = data.speed;
      if (data.canMove !== undefined) e.canMove = data.canMove;
    });
  },

  update(dt) {
    var mapPluginId = game.currentMap ? 'map_' + game.currentMap.id : null;
    var map = mapPluginId ? plugin.get(mapPluginId) : null;
    if (game.scene) game.scene.updateMatrixWorld(true);
    var meshes = map ? MeshCollider.collectMapMeshes(map) : null;
    var stepH = 0.4;
    var boundary = 28;

    for (var id in this._entities) {
      var e = this._entities[id];
      if (!e.mesh || !e.canMove) continue;

      if (e.target) {
        var _v3 = this._v3;
        _v3.copy(e.target).sub(e.mesh.position);
        var dist = _v3.length();
        _v3.y = 0;
        var distXZ = _v3.length();
        if (distXZ < 0.001) { e.target = null; continue; }
        _v3.divideScalar(distXZ);

        var moveSpeed = e.speed * dt;
        var dx = _v3.x * moveSpeed;
        var dz = _v3.z * moveSpeed;

        var nx = e.mesh.position.x + dx;
        var nz = e.mesh.position.z + dz;

        if (meshes && meshes.length > 0) {
          var result = MeshCollider.slideMove(
            e.mesh.position.x, e.y, e.mesh.position.z,
            dx, dz, meshes, e.radius || 0.3, stepH
          );
          nx = result.x; nz = result.z;

          var floorY = MeshCollider.getFloorY(nx, e.y, nz, meshes, stepH);
          if (floorY !== null) {
            var diff = floorY - e.y;
            if (diff <= stepH) e.y = floorY;
          }
        } else if (game._dynamicColliders) {
          // Fallback to box colliders for dynamic entities
          for (var ci = 0; ci < game._dynamicColliders.length; ci++) {
            var c = game._dynamicColliders[ci];
            if (!c.walkable) {
              var res = ColliderHelper.circleVsBox(nx, nz, e.radius || 0.3, c);
              nx = res.x; nz = res.z;
            }
          }
        }

        e.mesh.position.x = Math.max(-boundary, Math.min(boundary, nx));
        e.mesh.position.z = Math.max(-boundary, Math.min(boundary, nz));
        e.mesh.position.y = e.y;

        if (dist < 0.3) {
          e.target = null;
          plugin.emit('movement:arrived', { entityId: id, mesh: e.mesh });
        }
      }
    }
  },

  destroy() {
    this._entities = {};
    plugin.off('movement:register', this.id);
    plugin.off('movement:unregister', this.id);
    plugin.off('movement:move_to', this.id);
    plugin.off('movement:stop', this.id);
    plugin.off('movement:set_speed', this.id);
  }
});
