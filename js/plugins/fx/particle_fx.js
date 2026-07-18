var plugin = include('registry');

plugin.register({
  id: 'particle_fx',
  name: 'Parçacık Efektleri',
  type: 'graphics',
  version: '1.0',
  description: 'Patlama, kan, ölüm efektleri',
  priority: 10,

  game: null,
  particles: [],

  init(game) {
    this.game = game;
    this.particles = [];

    // Hook: zombie ölünce parti
    plugin.on('zombie:die', 'particle_fx', function(pos) {
      this.burst(pos, 0x4a7c3f, 15);
    }.bind(this));

    plugin.on('bullet:hit', 'particle_fx', function(pos) {
      this.burst(pos, 0xffaa00, 5);
    }.bind(this));
  },

  burst(position, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: position.x,
        y: 0.2,
        z: position.z,
        vx: Math.cos(angle) * speed,
        vy: 1 + Math.random() * 2,
        vz: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        size: 0.05 + Math.random() * 0.08,
        color: color,
        mesh: null
      });
    }
  },

  update(dt) {
    if (!this.game || !this.game.scene) return;
    const scene = this.game.scene;
    const toRemove = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        if (p.mesh) scene.remove(p.mesh);
        toRemove.push(i);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 4 * dt; // gravity
      p.z += p.vz * dt;

      if (!p.mesh) {
        const geo = new THREE.SphereGeometry(p.size, 4, 4);
        const mat = new THREE.MeshStandardMaterial({
          color: p.color,
          emissive: p.color,
          emissiveIntensity: 0.5
        });
        p.mesh = new THREE.Mesh(geo, mat);
        scene.add(p.mesh);
      }

      p.mesh.position.set(p.x, Math.max(0, p.y), p.z);
      const scale = p.life / p.maxLife;
      p.mesh.scale.setScalar(scale);
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.particles.splice(toRemove[i], 1);
    }
  },

  destroy() {
    const scene = this.game ? this.game.scene : null;
    this.particles.forEach(function(p) {
      if (p.mesh && scene) scene.remove(p.mesh);
    });
    this.particles = [];
  }
});
