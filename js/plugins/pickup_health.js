PluginRegistry.register({
  id: 'pickup_health',
  name: 'Sağlık Toplanabilir',
  version: '1.0',
  type: 'pickup',
  description: 'Nadiren düşen sağlık iksiri',

  game: null,
  pickups: [],

  init(game) {
    this.game = game;
    this.pickups = [];
    var self = this;

    PluginRegistry.on('zombie:die', this.id, function(pos) {
      // %25 ihtimalle sağlık düşür
      if (Math.random() < 0.25) {
        self.spawnPickup(pos);
      }
    });
  },

  spawnPickup: function(pos) {
    var game = this.game;
    if (!game || !game.scene) return;

    var geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    var mat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff2222,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.3, pos.z);
    game.scene.add(mesh);

    var glow = new THREE.PointLight(0xff4444, 0.3, 2);
    glow.position.copy(mesh.position);
    game.scene.add(glow);

    this.pickups.push({
      mesh: mesh,
      light: glow,
      healAmount: 20 + Math.floor(Math.random() * 15),
      life: 20,
      bobPhase: Math.random() * Math.PI * 2
    });
  },

  update: function(dt) {
    if (!this.game || !this.game.player || !this.game.player.mesh) return;

    var playerPos = this.game.player.mesh.position;
    var scene = this.game.scene;
    var toRemove = [];

    for (var i = 0; i < this.pickups.length; i++) {
      var p = this.pickups[i];
      p.life -= dt;

      p.bobPhase += dt * 2.5;
      p.mesh.position.y = 0.3 + Math.sin(p.bobPhase) * 0.15;
      p.mesh.rotation.y += dt * 2;
      if (p.light) p.light.position.copy(p.mesh.position);

      if (p.life <= 0) {
        toRemove.push(i);
        continue;
      }

      var dist = playerPos.distanceTo(p.mesh.position);
      if (dist < 0.8) {
        if (this.game.player.heal) {
          this.game.player.heal(p.healAmount);
        }
        PluginRegistry.emit('pickup:collect', {
          heal: p.healAmount,
          position: p.mesh.position.clone()
        });
        toRemove.push(i);
      }
    }

    for (var i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      var p = this.pickups[idx];
      if (p.mesh) scene.remove(p.mesh);
      if (p.light) scene.remove(p.light);
      this.pickups.splice(idx, 1);
    }
  },

  destroy: function() {
    var scene = this.game.scene;
    this.pickups.forEach(function(p) {
      if (p.mesh) scene.remove(p.mesh);
      if (p.light) scene.remove(p.light);
    });
    this.pickups = [];
    PluginRegistry.off('zombie:die', this.id);
  }
});
