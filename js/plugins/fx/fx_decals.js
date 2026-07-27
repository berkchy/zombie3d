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
  _poolTex: null,
  MAX_DECALS: 80,

  init() {
    this._decals = [];
    this._holeTex = this._makeHoleTex();
    this._poolTex = this._makePoolTex();

    this._holeMat = new THREE.SpriteMaterial({
      map: this._holeTex, transparent: true, opacity: 1, depthTest: false, depthWrite: false
    });

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
    c.width = 32; c.height = 32;
    var ctx = c.getContext('2d');

    ctx.clearRect(0, 0, 32, 32);

    // Sadece opak koyu benek + delik
    // Dis halka (yanik)
    ctx.beginPath();
    ctx.arc(16, 16, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,8,5,1)';
    ctx.fill();

    // Ic halka (koyu gri)
    ctx.beginPath();
    ctx.arc(16, 16, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,25,20,1)';
    ctx.fill();

    // Merkezde delik (saydam)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(16, 16, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Catlaklar
    ctx.strokeStyle = 'rgba(5,5,5,0.6)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i < 4; i++) {
      var a = Math.random() * Math.PI * 2;
      var len = 2 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(16, 16);
      ctx.lineTo(16 + Math.cos(a) * len, 16 + Math.sin(a) * len);
      ctx.stroke();
    }

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
    var sprite = new THREE.Sprite(this._holeMat.clone());
    sprite.position.copy(pos);
    // Biraz kameraya dogru cek (mermi collider'in icinde kaliyor)
    if (game && game.camera) {
      var dir = new THREE.Vector3().subVectors(game.camera.position, pos).normalize();
      sprite.position.add(dir.multiplyScalar(0.08));
    }
    sprite.scale.set(0.06, 0.06, 1);
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
