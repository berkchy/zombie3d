var plugin = include('registry');

plugin.register({
  id: 'fx_zombie_spawn',
  name: 'Zombi Dogum',
  type: 'graphics',
  version: '1.0',
  description: 'Zombi dogunca duman/yükselen toz',
  priority: 11,

  _puffs: [],
  _tex: null,

  init() {
    this._puffs = [];
    this._tex = this._makeTex();

    var self = this;
    plugin.on('zombie:spawn', this.id, function(data) {
      if (!data || !data.position) return;
      // bir kac saniye gecikmeli cunku spawn animasyonu var
      self._puff(data.position);
    });
  },

  _makeTex() {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(200,200,200,0.5)');
    g.addColorStop(0.3, 'rgba(160,160,160,0.3)');
    g.addColorStop(0.6, 'rgba(120,120,120,0.15)');
    g.addColorStop(1, 'rgba(80,80,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  _puff(pos) {
    if (!game || !game.scene) return;
    for (var i = 0; i < 4; i++) {
      var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this._tex,
        color: 0xcccccc,
        transparent: true,
        opacity: 0.4,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NormalBlending
      }));
      sprite.position.set(
        pos.x + (Math.random() - 0.5) * 0.4,
        0.1,
        pos.z + (Math.random() - 0.5) * 0.4
      );
      sprite.scale.set(0.3, 0.3, 1);
      sprite.renderOrder = 1;
      game.scene.add(sprite);

      this._puffs.push({
        sprite: sprite,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.3 + Math.random() * 0.5,
        vz: (Math.random() - 0.5) * 0.5,
        life: 1.2 + Math.random() * 0.4,
        maxLife: 1.6,
        startScale: 0.3 + Math.random() * 0.2
      });
    }
  },

  update(dt) {
    if (!game || !game.scene || !this._puffs.length) return;
    var scene = game.scene;
    for (var i = this._puffs.length - 1; i >= 0; i--) {
      var p = this._puffs[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.sprite);
        p.sprite.material.dispose();
        this._puffs.splice(i, 1);
        continue;
      }
      var t = 1 - p.life / p.maxLife;
      p.sprite.position.x += p.vx * dt;
      p.sprite.position.y += p.vy * dt;
      p.sprite.position.z += p.vz * dt;
      var sc = p.startScale * (1 + t * 2);
      p.sprite.scale.set(sc, sc, 1);
      p.sprite.material.opacity = (1 - t) * 0.4;
    }
  },

  destroy() {
    var scene = game ? game.scene : null;
    for (var i = 0; i < this._puffs.length; i++) {
      if (this._puffs[i].sprite && scene) scene.remove(this._puffs[i].sprite);
    }
    this._puffs = [];
    if (this._tex) this._tex.dispose();
    plugin.off('zombie:spawn', this.id);
  }
});
