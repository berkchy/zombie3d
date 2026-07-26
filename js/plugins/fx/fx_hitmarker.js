var plugin = include('registry');

plugin.register({
  id: 'fx_hitmarker',
  name: 'Hit Marker',
  type: 'graphics',
  version: '1.0',
  description: 'Merminin isabet ettiği noktada + işareti gösterir',

  _markers: [],
  _texture: null,

  init() {
    this._markers = [];
    this._texture = this._makeTexture();

    var self = this;
    plugin.on('bullet:impact', this.id, function(data) {
      if (data && data.position) {
        var col = data.type === 'wall' ? 0xffffff : 0xffaa44;
        self._add(data.position, col);
      }
    });
  },

  _makeTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 64, 64);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(32, 10);
    ctx.lineTo(32, 54);
    ctx.moveTo(10, 32);
    ctx.lineTo(54, 32);
    ctx.stroke();

    var tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  },

  _add(pos, color) {
    if (!this._texture) return;

    var mat = new THREE.SpriteMaterial({
      map: this._texture,
      color: color,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false
    });

    var sprite = new THREE.Sprite(mat);
    sprite.position.copy(pos);
    sprite.scale.set(0.3, 0.3, 1);
    sprite.renderOrder = 999;

    if (game && game.scene) game.scene.add(sprite);

    this._markers.push({ mesh: sprite, life: 0.35, maxLife: 0.35, mat: mat });
  },

  update(dt) {
    for (var i = this._markers.length - 1; i >= 0; i--) {
      var m = this._markers[i];
      m.life -= dt;
      var t = Math.max(0, m.life / m.maxLife);
      m.mat.opacity = t;
      if (m.life <= 0) {
        if (m.mesh.parent) m.mesh.parent.remove(m.mesh);
        m.mat.dispose();
        this._markers.splice(i, 1);
      }
    }
  },

  destroy() {
    for (var i = 0; i < this._markers.length; i++) {
      var m = this._markers[i];
      if (m.mesh.parent) m.mesh.parent.remove(m.mesh);
      if (m.mat) m.mat.dispose();
    }
    this._markers = [];
    if (this._texture) this._texture.dispose();
    plugin.off('bullet:impact', this.id);
  }
});
