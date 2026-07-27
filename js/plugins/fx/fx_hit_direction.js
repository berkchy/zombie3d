var plugin = include('registry');

plugin.register({
  id: 'fx_hit_direction',
  name: 'Hasar Yonu',
  type: 'graphics',
  version: '1.0',
  description: 'Hasar alinca saldiran yonunde kirmizi indicator',
  priority: 11,

  _indicators: [],
  _tex: null,

  init() {
    this._indicators = [];
    this._tex = this._makeTex();

    var self = this;
    plugin.on('player:hit', this.id, function(data) {
      if (!data) return;
      self._showDirection();
    });
  },

  _makeTex() {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = 'rgba(255,50,50,0.8)';
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.lineTo(20, 60);
    ctx.lineTo(32, 46);
    ctx.lineTo(44, 60);
    ctx.closePath();
    ctx.fill();
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  },

  _showDirection() {
    // En yakin zombiyi bul
    var nearest = null;
    var nearestDist = Infinity;
    var zombiePlugin = plugin.get('zombie_basic');
    if (zombiePlugin && zombiePlugin.enabled && zombiePlugin.zombies) {
      for (var i = 0; i < zombiePlugin.zombies.length; i++) {
        var z = zombiePlugin.zombies[i];
        if (!z || !z.alive || !z.mesh) continue;
        var dx = z.mesh.position.x - game.player.mesh.position.x;
        var dz = z.mesh.position.z - game.player.mesh.position.z;
        var d = dx * dx + dz * dz;
        if (d < nearestDist) {
          nearestDist = d;
          nearest = z.mesh.position;
        }
      }
    }
    if (!nearest) return;

    var dx = nearest.x - game.player.mesh.position.x;
    var dz = nearest.z - game.player.mesh.position.z;
    var angle = Math.atan2(dx, dz);

    var yaw = game.fpYaw || 0;
    var relAngle = angle - yaw;

    var indicator = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this._tex,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    indicator.material.rotation = relAngle;
    indicator.scale.set(0.08, 0.08, 1);
    indicator.renderOrder = 999;

    // Overlay kameraya ekle
    var fp = plugin.get('fx_firstperson');
    var ovCam = fp && fp.enabled ? (fp._overlayCamera || fp.camera) : null;
    var parent = ovCam || game.camera;
    if (parent) {
      parent.add(indicator);
      indicator.position.set(0, 0, -0.5);
      var dist = 0.3;
      var ix = Math.sin(relAngle) * dist;
      var iy = -Math.cos(relAngle) * dist * 0.7;
      indicator.position.set(ix, iy, -0.5);
    }

    this._indicators.push({
      sprite: indicator,
      parent: parent,
      life: 0.8,
      maxLife: 0.8
    });
  },

  update(dt) {
    for (var i = this._indicators.length - 1; i >= 0; i--) {
      var ind = this._indicators[i];
      ind.life -= dt;
      var t = Math.max(0, ind.life / ind.maxLife);
      ind.sprite.material.opacity = t;
      ind.sprite.scale.set(0.08 * (1 + (1 - t) * 0.5), 0.08 * (1 + (1 - t) * 0.5), 1);
      if (ind.life <= 0) {
        if (ind.parent) ind.parent.remove(ind.sprite);
        ind.sprite.material.dispose();
        this._indicators.splice(i, 1);
      }
    }
  },

  destroy() {
    for (var i = 0; i < this._indicators.length; i++) {
      var ind = this._indicators[i];
      if (ind.parent) ind.parent.remove(ind.sprite);
    }
    this._indicators = [];
    if (this._tex) this._tex.dispose();
    plugin.off('player:hit', this.id);
  }
});
