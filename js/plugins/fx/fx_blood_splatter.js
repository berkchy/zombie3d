var plugin = include('registry');

plugin.register({
  id: 'fx_blood_splatter',
  name: 'Kan Sıçraması',
  type: 'graphics',
  version: '3.0',
  description: 'Mermi carpiği konumdan kan damlalari + havuz (hitType miktar)',
  priority: 11,

  _drops: [],
  _pools: [],
  _tex: null,
  _poolTex: null,
  _lastHitType: null,

  init() {
    this._drops = [];
    this._pools = [];
    this._tex = this._makeDropTexture();
    this._poolTex = this._makePoolTexture();

    var self = this;

    // zombie:hit fires BEFORE bullet:hit — store hitType for exact position spray
    plugin.on('zombie:hit', this.id, function(data) {
      if (!data) return;
      self._lastHitType = data.hitType || 'body';
    });

    // bullet:hit = exact impact position from system_bullet
    plugin.on('bullet:hit', this.id, function(data) {
      if (!data || !data.position) return;
      var ht = self._lastHitType || 'body';
      self._spray(data.position, ht === 'head' ? 22 : 12);
      self._lastHitType = null;
    });

    // enemy:hit — small blood at zombie center (fallback for boss, no bullet:hit)
    plugin.on('enemy:hit', this.id, function(data) {
      if (!data || !data.position || data.damage <= 0) return;
      self._lastHitType = null; // clear stale hitType from previous cycle
      self._spray(data.position, 5);
    });

    plugin.on('zombie:die', this.id, function(pos) {
      if (!pos) return;
      self._spray(pos, 25);
      self._pool(pos);
    });
  },

  _makeDropTexture() {
    var c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(180,20,20,1)');
    g.addColorStop(0.3, 'rgba(160,10,10,0.9)');
    g.addColorStop(0.7, 'rgba(100,0,0,0.5)');
    g.addColorStop(1, 'rgba(50,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  _makePoolTexture() {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(80,5,5,0.6)');
    g.addColorStop(0.5, 'rgba(50,3,3,0.4)');
    g.addColorStop(1, 'rgba(20,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(32, 32, 28, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  _spray(pos, count) {
    if (!game || !game.scene) return;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 3.5;
      var color = new THREE.Color(Math.random() < 0.6 ? 0xdd2222 : 0x88bb22);
      var s = 0.03 + Math.random() * 0.05;

      var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this._tex,
        color: color,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NormalBlending
      }));
      sprite.position.set(
        pos.x + (Math.random() - 0.5) * 0.15,
        pos.y + Math.random() * 0.3,
        pos.z + (Math.random() - 0.5) * 0.15
      );
      sprite.scale.set(s * 2, s * 2, 1);
      sprite.renderOrder = 998;
      game.scene.add(sprite);

      this._drops.push({
        sprite: sprite,
        vx: Math.cos(angle) * speed,
        vy: 0.5 + Math.random() * 3,
        vz: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        startScale: s * 2
      });
    }
  },

  _pool(pos) {
    if (!game || !game.scene) return;
    var pool = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.4),
      new THREE.MeshBasicMaterial({
        map: this._poolTex,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(pos.x, 0.01, pos.z);
    pool.renderOrder = 1;
    game.scene.add(pool);
    this._pools.push({ mesh: pool, life: 8, maxLife: 8 });
  },

  update(dt) {
    if (!game || !game.scene) return;
    var scene = game.scene;
    var toRemove = [];

    for (var i = 0; i < this._drops.length; i++) {
      var d = this._drops[i];
      d.life -= dt;

      if (d.life <= 0) {
        scene.remove(d.sprite);
        d.sprite.material.dispose();
        toRemove.push(i);
        continue;
      }

      d.vy -= 6 * dt;
      d.sprite.position.x += d.vx * dt;
      d.sprite.position.y += d.vy * dt;
      d.sprite.position.z += d.vz * dt;

      if (d.sprite.position.y < 0) {
        d.sprite.position.y = 0;
        d.vx *= 0.3;
        d.vz *= 0.3;
      }

      var t = d.life / d.maxLife;
      var sc = d.startScale * (0.3 + t * 0.7);
      d.sprite.scale.set(sc, sc, 1);
      d.sprite.material.opacity = t;
    }

    for (var i = toRemove.length - 1; i >= 0; i--) {
      this._drops.splice(toRemove[i], 1);
    }

    for (var i = this._pools.length - 1; i >= 0; i--) {
      var p = this._pools[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this._pools.splice(i, 1);
      } else {
        p.mesh.material.opacity = Math.min(1, p.life / p.maxLife * 2);
      }
    }
  },

  destroy() {
    var scene = game ? game.scene : null;
    for (var i = 0; i < this._drops.length; i++) {
      if (this._drops[i].sprite && scene) scene.remove(this._drops[i].sprite);
    }
    for (var i = 0; i < this._pools.length; i++) {
      if (this._pools[i].mesh && scene) scene.remove(this._pools[i].mesh);
    }
    this._drops = [];
    this._pools = [];
    if (this._tex) this._tex.dispose();
    if (this._poolTex) this._poolTex.dispose();
    plugin.off('zombie:hit', this.id);
    plugin.off('bullet:hit', this.id);
    plugin.off('enemy:hit', this.id);
    plugin.off('zombie:die', this.id);
  }
});
