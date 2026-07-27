var plugin = include('registry');

plugin.register({
  id: 'fx_impact_sparks',
  name: 'Kıvılcım',
  type: 'graphics',
  version: '2.0',
  description: 'Mermi duvara carparsa kivilcim (yavas smooth)',
  priority: 11,

  _particles: [],
  _tex: null,

  init() {
    this._particles = [];
    this._tex = this._makeTex();

    var self = this;
    plugin.on('bullet:impact', this.id, function(data) {
      if (!data || !data.position) return;
      if (data.type === 'wall') self._spark(data.position);
    });
  },

  _makeTex() {
    var c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,220,1)');
    g.addColorStop(0.2, 'rgba(255,220,100,0.9)');
    g.addColorStop(0.5, 'rgba(255,160,40,0.5)');
    g.addColorStop(1, 'rgba(180,80,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  _spark(pos) {
    if (!game || !game.scene) return;
    for (var i = 0; i < 8; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1.5 + Math.random() * 2.5;

      var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this._tex,
        color: 0xffdd77,
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      sprite.position.copy(pos);
      sprite.position.x += (Math.random() - 0.5) * 0.08;
      sprite.position.z += (Math.random() - 0.5) * 0.08;
      sprite.scale.set(0.04, 0.04, 1);
      sprite.renderOrder = 997;
      game.scene.add(sprite);

      this._particles.push({
        sprite: sprite,
        vx: Math.cos(angle) * speed,
        vy: 0.3 + Math.random() * 1.5,
        vz: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }
  },

  update(dt) {
    if (!game || !game.scene || !this._particles.length) return;
    var scene = game.scene;
    for (var i = this._particles.length - 1; i >= 0; i--) {
      var p = this._particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.sprite);
        p.sprite.material.dispose();
        this._particles.splice(i, 1);
        continue;
      }
      var t = p.life / p.maxLife;
      p.sprite.position.x += p.vx * dt;
      p.sprite.position.y += p.vy * dt;
      p.vy -= 3 * dt;
      p.sprite.position.z += p.vz * dt;
      if (p.sprite.position.y < 0) p.sprite.position.y = 0;
      p.sprite.material.opacity = t * t;
      var sc = 0.04 * (0.3 + t * 0.7);
      p.sprite.scale.set(sc, sc, 1);
    }
  },

  destroy() {
    var scene = game ? game.scene : null;
    for (var i = 0; i < this._particles.length; i++) {
      if (this._particles[i].sprite && scene) scene.remove(this._particles[i].sprite);
    }
    this._particles = [];
    if (this._tex) this._tex.dispose();
    plugin.off('bullet:impact', this.id);
  }
});
