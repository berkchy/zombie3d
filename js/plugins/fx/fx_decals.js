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
    this._holeTex = this._makeTex(0x222222, 0x444444);
    this._bloodTex = this._makeTex(0x661111, 0xaa2222);

    var self = this;

    plugin.on('bullet:impact', this.id, function(data) {
      if (!data || !data.position) return;
      if (data.type === 'wall') self._addHole(data.position);
      else self._addBlood(data.position);
    });

    plugin.on('zombie:die', this.id, function(pos) {
      if (!pos) return;
      self._addPool(pos);
    });
  },

  _makeTex(col1, col2) {
    var c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(' + ((col2>>16)&255) + ',' + ((col2>>8)&255) + ',' + (col2&255) + ',0.9)');
    g.addColorStop(0.4, 'rgba(' + ((col1>>16)&255) + ',' + ((col1>>8)&255) + ',' + (col1&255) + ',0.7)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  _addHole(pos) {
    if (this._decals.length >= this.MAX_DECALS) this._removeOldest();
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this._holeTex, transparent: true, opacity: 0.8, depthTest: true, depthWrite: false
    }));
    sprite.position.copy(pos);
    sprite.position.x += (Math.random() - 0.5) * 0.05;
    sprite.position.z += (Math.random() - 0.5) * 0.05;
    sprite.scale.set(0.08, 0.08, 1);
    sprite.renderOrder = 2;
    if (game && game.scene) game.scene.add(sprite);
    this._decals.push({ sprite: sprite, life: 25, maxLife: 25 });
  },

  _addBlood(pos) {
    if (this._decals.length >= this.MAX_DECALS) this._removeOldest();
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this._bloodTex, transparent: true, opacity: 0.7, depthTest: true, depthWrite: false
    }));
    sprite.position.copy(pos);
    sprite.position.y += 0.02;
    sprite.scale.set(0.12, 0.12, 1);
    sprite.renderOrder = 2;
    if (game && game.scene) game.scene.add(sprite);
    this._decals.push({ sprite: sprite, life: 20, maxLife: 20 });
  },

  _addPool(pos) {
    if (this._decals.length >= this.MAX_DECALS) this._removeOldest();
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.3),
      new THREE.MeshBasicMaterial({
        map: this._bloodTex, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide
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
    if (this._bloodTex) this._bloodTex.dispose();
    plugin.off('bullet:impact', this.id);
    plugin.off('zombie:die', this.id);
  }
});
