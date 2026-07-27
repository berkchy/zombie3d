var plugin = include('registry');

plugin.register({
  id: 'fx_tracer',
  name: 'Mermi Tracer',
  type: 'graphics',
  version: '1.1',
  description: 'Mermi yolunu gosteren isin',
  priority: 11,

  _tracers: [],

  init() {
    this._tracers = [];

    var self = this;
    plugin.on('weapon:fire', this.id, function(data) {
      if (!data || !data.position || !data.direction) return;
      var len = data.weapon && data.weapon.id === 'weapon_shotgun' ? 4 : 8;
      self._add(data.position, data.direction, len);
    });
  },

  _add(pos, dir, len) {
    if (!game || !game.scene) return;

    var end = new THREE.Vector3().copy(pos).add(dir.clone().multiplyScalar(len));

    var geo = new THREE.BufferGeometry();
    var verts = new Float32Array([
      pos.x, pos.y + 0.05, pos.z,
      end.x, end.y + 0.05, end.z
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));

    var mat = new THREE.LineBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0.8,
      linewidth: 1
    });

    var line = new THREE.Line(geo, mat);
    game.scene.add(line);

    this._tracers.push({
      line: line,
      life: 0.1,
      maxLife: 0.1
    });
  },

  update(dt) {
    if (!game || !game.scene || !this._tracers.length) return;
    var scene = game.scene;
    for (var i = this._tracers.length - 1; i >= 0; i--) {
      var t = this._tracers[i];
      t.life -= dt;
      var alpha = Math.max(0, t.life / t.maxLife);
      t.line.material.opacity = alpha;
      if (t.life <= 0) {
        scene.remove(t.line);
        t.line.geometry.dispose();
        t.line.material.dispose();
        this._tracers.splice(i, 1);
      }
    }
  },

  destroy() {
    var scene = game ? game.scene : null;
    for (var i = 0; i < this._tracers.length; i++) {
      if (this._tracers[i].line && scene) scene.remove(this._tracers[i].line);
    }
    this._tracers = [];
    plugin.off('weapon:fire', this.id);
  }
});
