var plugin = include('registry');

plugin.register({
  id: 'player_movement',
  name: 'Karakter Hareketi',
  type: 'player',
  version: '2.0',
  description: 'Oyuncu hareketi + harita collider + yuru',
  priority: 20,
  enabled: true,

  speed: 5,
  velX: 0,
  velZ: 0,
  accel: 20,
  friction: 12,
  playerY: 0,

  init(game) {
    this.game = game;
    if (!game.input) game.input = { x: 0, y: 0 };
    this.velX = 0;
    this.velZ = 0;
    this.playerY = 0;

    var self = this;
    game.move = {
      get speed() { return self.speed; },
      setSpeed: function(v) { self.speed = v; }
    };
  },

  update(dt) {
    var mesh = game.playerMesh;
    if (!mesh) return;
    if (game && game._dying) return;

    var inputX = game.input.x;
    var inputZ = game.input.y;
    var isMoving = inputX !== 0 || inputZ !== 0;

    if (isMoving) {
      var targetVX, targetVZ;
      var fp = plugin.get('fx_firstperson');
      if (fp && fp.enabled && mesh.rotation.y !== undefined) {
        var yaw = mesh.rotation.y;
        var cosY = Math.cos(yaw);
        var sinY = Math.sin(yaw);
        targetVX = (inputX * cosY + inputZ * sinY) * this.speed;
        targetVZ = (-inputX * sinY + inputZ * cosY) * this.speed;
      } else {
        targetVX = inputX * this.speed;
        targetVZ = inputZ * this.speed;
      }

      var diffX = targetVX - this.velX;
      var diffZ = targetVZ - this.velZ;
      var diffLen = Math.sqrt(diffX * diffX + diffZ * diffZ);

      if (diffLen > 0.001) {
        var maxAccel = this.accel * dt;
        if (maxAccel > diffLen) maxAccel = diffLen;
        this.velX += (diffX / diffLen) * maxAccel;
        this.velZ += (diffZ / diffLen) * maxAccel;
      }
    } else {
      var spd = Math.sqrt(this.velX * this.velX + this.velZ * this.velZ);
      if (spd > 0.001) {
        var decay = this.friction * dt;
        if (decay > spd) decay = spd;
        this.velX -= (this.velX / spd) * decay;
        this.velZ -= (this.velZ / spd) * decay;
      }
    }

    // Yeni pozisyon (kaba)
    var nx = mesh.position.x + this.velX * dt;
    var nz = mesh.position.z + this.velZ * dt;

    // Harita collider kontrolu — su anki haritadan
    var mapPluginId = game.currentMap ? 'map_' + game.currentMap.id : null;
    var map = mapPluginId ? plugin.get(mapPluginId) : null;
    if (map && map.getColliders) {
      var colliders = map.getColliders();
      var pr = 0.3;
      var stepH = 0.4;
      var floorY = 0;

      for (var i = 0; i < colliders.length; i++) {
        var c = colliders[i];
        var minX = c.min[0], minY = c.min[1], minZ = c.min[2];
        var maxX = c.max[0], maxY = c.max[1], maxZ = c.max[2];

        if (c.walkable) {
          // Oyuncu merkezi bu alanin icinde mi?
          if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
            var topY = maxY;
            if (topY >= floorY) {
              var diff = topY - this.playerY;
              if (diff > stepH) {
                // Cok yuksek — adim asamaz ama itme de (x yonunde de)
                // sadece bu yuzey icin floorY'i guncelleme
              } else {
                floorY = topY;
              }
            }
          }
        } else {
          // Duvarlar / katı cisimler
          var res = this._pushCircleAABB(nx, nz, pr, minX, minZ, maxX, maxZ);
          nx = res.x; nz = res.z;
        }
      }

      this.playerY = floorY;
      mesh.position.y = this.playerY;
    }

    // Sinir kontrolu (yedek)
    var half = 28;
    mesh.position.x = Math.max(-half, Math.min(half, nx));
    mesh.position.z = Math.max(-half, Math.min(half, nz));

    var speed = Math.sqrt(this.velX * this.velX + this.velZ * this.velZ);
    plugin.emit('player:moving', {
      x: mesh.position.x,
      z: mesh.position.z,
      dx: this.velX,
      dz: this.velZ,
      speed: speed
    });
  },

  _pushCircleAABB: function(px, pz, radius, minX, minZ, maxX, maxZ) {
    var closestX = Math.max(minX, Math.min(maxX, px));
    var closestZ = Math.max(minZ, Math.min(maxZ, pz));
    var dx = px - closestX;
    var dz = pz - closestZ;
    var distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      if (distSq > 0.0001) {
        var dist = Math.sqrt(distSq);
        var overlap = radius - dist;
        px += (dx / dist) * overlap;
        pz += (dz / dist) * overlap;
      } else {
        // Iceride — en yakin kenara it
        var ox = Math.min(px - minX, maxX - px);
        var oz = Math.min(pz - minZ, maxZ - pz);
        if (ox < oz) {
          px += (px - minX < maxX - px ? -(ox + radius) : (ox + radius));
        } else {
          pz += (pz - minZ < maxZ - pz ? -(oz + radius) : (oz + radius));
        }
      }
    }
    return { x: px, z: pz };
  }
});
