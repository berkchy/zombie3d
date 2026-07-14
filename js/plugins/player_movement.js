PluginRegistry.register({
  id: 'player_movement',
  name: 'Karakter Hareketi',
  type: 'player',
  version: '1.0',
  description: 'Oyuncu hareket mantığı',
  priority: 20,
  enabled: true,

  speed: 8,

  init(game) {
    this.game = game;
    if (!game.input) game.input = { x: 0, y: 0 };

    var self = this;
    game.move = {
      get speed() { return self.speed; },
      setSpeed: function(v) { self.speed = v; }
    };
  },

  update(dt) {
    var mesh = game.playerMesh;
    if (!mesh) return;

    var dx = game.input.x;
    var dz = game.input.y;
    var isMoving = dx !== 0 || dz !== 0;

    if (isMoving) {
      mesh.position.x += dx * this.speed * dt;
      mesh.position.z += dz * this.speed * dt;

      var half = 28;
      mesh.position.x = Math.max(-half, Math.min(half, mesh.position.x));
      mesh.position.z = Math.max(-half, Math.min(half, mesh.position.z));

      PluginRegistry.emit('player:moving', {
        x: mesh.position.x,
        z: mesh.position.z,
        dx: dx,
        dz: dz,
        speed: this.speed
      });
    }
  }
});
