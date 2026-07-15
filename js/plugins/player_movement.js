PluginRegistry.register({
  id: 'player_movement',
  name: 'Karakter Hareketi',
  type: 'player',
  version: '1.1',
  description: 'Oyuncu hareket mantigi — hizlanma/yavaslama',
  priority: 20,
  enabled: true,

  speed: 8,
  velX: 0,
  velZ: 0,
  accel: 20,
  friction: 12,

  init(game) {
    this.game = game;
    if (!game.input) game.input = { x: 0, y: 0 };
    this.velX = 0;
    this.velZ = 0;

    var self = this;
    game.move = {
      get speed() { return self.speed; },
      setSpeed: function(v) { self.speed = v; }
    };
  },

  update(dt) {
    var mesh = game.playerMesh;
    if (!mesh) return;

    var inputX = game.input.x;
    var inputZ = game.input.y;
    var isMoving = inputX !== 0 || inputZ !== 0;

    if (isMoving) {
      var targetVX = inputX * this.speed;
      var targetVZ = inputZ * this.speed;

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

    mesh.position.x += this.velX * dt;
    mesh.position.z += this.velZ * dt;

    var half = 28;
    mesh.position.x = Math.max(-half, Math.min(half, mesh.position.x));
    mesh.position.z = Math.max(-half, Math.min(half, mesh.position.z));

    if (isMoving || Math.abs(this.velX) > 0.01 || Math.abs(this.velZ) > 0.01) {
      PluginRegistry.emit('player:moving', {
        x: mesh.position.x,
        z: mesh.position.z,
        dx: this.velX,
        dz: this.velZ,
        speed: Math.sqrt(this.velX * this.velX + this.velZ * this.velZ)
      });
    }
  }
});
