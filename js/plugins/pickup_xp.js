PluginRegistry.register({
  id: 'pickup_xp',
  name: 'XP Toplanabilir',
  version: '1.0',
  type: 'pickup',
  description: 'Zombilerden düşen XP orbları',

  game: null,
  pickups: [],

  init(game) {
    this.game = game;
    this.pickups = [];
    var self = this;

    PluginRegistry.on('zombie:die', this.id, function(pos) {
      self.spawnPickup(pos);
    });
  },

  spawnPickup: function(pos) {
    var game = this.game;
    if (!game || !game.scene) return;

    var geo = new THREE.SphereGeometry(0.15, 8, 8);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.3, pos.z);
    mesh.position.y = 0.3 + Math.random() * 0.2;
    game.scene.add(mesh);

    var glow = new THREE.PointLight(0x00ff88, 0.3, 2);
    glow.position.copy(mesh.position);
    game.scene.add(glow);

    this.pickups.push({
      mesh: mesh,
      light: glow,
      xp: 10 + Math.floor(Math.random() * 10),
      life: 15,
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

      // Bob animasyonu
      p.bobPhase += dt * 3;
      p.mesh.position.y = 0.3 + Math.sin(p.bobPhase) * 0.15;
      if (p.light) p.light.position.copy(p.mesh.position);

      if (p.life <= 0) {
        toRemove.push(i);
        continue;
      }

      // Player collision
      var dist = playerPos.distanceTo(p.mesh.position);
      if (dist < 0.8) {
        // Topla
        if (this.game.player.addXp) {
          this.game.player.addXp(p.xp);
        }
        PluginRegistry.emit('pickup:collect', {
          xp: p.xp,
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
