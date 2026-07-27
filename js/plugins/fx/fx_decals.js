var plugin = include('registry');

plugin.register({
  id: 'fx_decals',
  name: 'Mermi Izleri + Kan',
  type: 'graphics',
  version: '1.0',
  description: 'Duvarda mermi deligi, yerde kan lekeleri',
  priority: 11,

  _decals: [],
  _holeTex: null,
  _bloodTex: null,
  MAX_DECALS: 80,

  init() {
    this._decals = [];
    this._holeTex = this._makeHoleTex();
    this._poolTex = this._makePoolTex();

    var self = this;

    plugin.on('bullet:impact', this.id, function(data) {
      if (!data || !data.position) return;
      if (data.type === 'wall') self._addHole(data.position);
      // flesh impact'te decal ekleme — zombie hareket eder, havada kalir
    });

    plugin.on('zombie:die', this.id, function(pos) {
      if (!pos) return;
      self._addPool(pos);
    });
  },

  _makeHoleTex() {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var ctx = c.getContext('2d');

    // Temizle
    ctx.clearRect(0, 0, 64, 64);

    // Koyu lekelenme (sicaklik yanigi)
    var burn = ctx.createRadialGradient(32, 32, 0, 32, 32, 16);
    burn.addColorStop(0, 'rgba(10,10,10,0.9)');
    burn.addColorStop(0.4, 'rgba(30,25,20,0.7)');
    burn.addColorStop(0.7, 'rgba(50,40,30,0.3)');
    burn.addColorStop(1, 'rgba(60,50,40,0)');
    ctx.fillStyle = burn;
    ctx.fillRect(0, 0, 64, 64);

    // Delik
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(32, 32, 3 + Math.random() * 1.5, 2 + Math.random() * 1.5, Math.random() * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();

    // Delik etrafinda yirtik/catlak
    ctx.strokeStyle = 'rgba(15,15,15,0.7)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i < 6; i++) {
      var a = Math.random() * Math.PI * 2;
      var len = 4 + Math.random() * 10;
      ctx.beginPath();
      ctx.moveTo(32, 32);
      ctx.lineTo(32 + Math.cos(a) * len, 32 + Math.sin(a) * len);
      ctx.stroke();
    }

    // Kenarlarda hafif aydinlanma (isik)
    var light = ctx.createRadialGradient(28, 28, 0, 32, 32, 20);
    light.addColorStop(0, 'rgba(80,75,65,0)');
    light.addColorStop(1, 'rgba(80,75,65,0.15)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 64, 64);

    ctx.restore();

    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  _makePoolTex() {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(80,5,5,0.5)');
    g.addColorStop(0.4, 'rgba(60,3,3,0.4)');
    g.addColorStop(0.7, 'rgba(40,2,2,0.2)');
    g.addColorStop(1, 'rgba(20,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(32, 32, 28, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  _addHole(pos) {
    if (this._decals.length >= this.MAX_DECALS) this._removeOldest();
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this._holeTex, transparent: true, opacity: 0.8, depthTest: false, depthWrite: false
    }));
    sprite.position.copy(pos);
    // Biraz kameraya dogru cek (mermi collider'in icinde kaliyor)
    if (game && game.camera) {
      var dir = new THREE.Vector3().subVectors(game.camera.position, pos).normalize();
      sprite.position.add(dir.multiplyScalar(0.08));
    }
    sprite.scale.set(0.1, 0.1, 1);
    sprite.renderOrder = 2;
    if (game && game.scene) game.scene.add(sprite);
    this._decals.push({ sprite: sprite, life: 25, maxLife: 25 });
  },

  _addPool(pos) {
    if (this._decals.length >= this.MAX_DECALS) this._removeOldest();
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.3),
      new THREE.MeshBasicMaterial({
        map: this._poolTex, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, 0.01, pos.z);
    mesh.renderOrder = 1;
    if (game && game.scene) game.scene.add(mesh);
    this._decals.push({ mesh: mesh, life: 30, maxLife: 30, isPool: true });
  },

  _removeOldest() {
    var d = this._decals.shift();
    this._removeDecal(d);
  },

  _removeDecal(d) {
    if (!d) return;
    var obj = d.mesh || d.sprite;
    if (!obj) return;
    if (obj.parent) obj.parent.remove(obj);
    if (obj.material) obj.material.dispose();
    if (obj.geometry) obj.geometry.dispose();
  },

  update(dt) {
    if (!game || !game.scene) return;
    for (var i = this._decals.length - 1; i >= 0; i--) {
      var d = this._decals[i];
      d.life -= dt;
      if (d.life <= 0) {
        this._removeDecal(d);
        this._decals.splice(i, 1);
      } else {
        var t = d.life / d.maxLife;
        if (t < 0.3) {
          var obj = d.mesh || d.sprite;
          if (obj && obj.material) obj.material.opacity = t / 0.3 * (d.isPool ? 0.5 : 0.8);
        }
      }
    }
  },

  destroy() {
    for (var i = 0; i < this._decals.length; i++) {
      this._removeDecal(this._decals[i]);
    }
    this._decals = [];
    if (this._holeTex) this._holeTex.dispose();
    if (this._poolTex) this._poolTex.dispose();
    plugin.off('bullet:impact', this.id);
    plugin.off('zombie:die', this.id);
  }
});
