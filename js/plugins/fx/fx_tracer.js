var plugin = include('registry');

plugin.register({
  id: 'fx_tracer',
  name: 'Mermi Tracer',
  type: 'graphics',
  version: '2.0',
  description: 'Namlu ucundan cikan smooth tracer',
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

    // FP'de namlu ucuna kaydir (kamera agzidan degil barrel tip'den ciksin)
    var start = pos.clone();
    var fp = plugin.get('fx_firstperson');
    if (fp && fp.enabled) {
      // barrel yaklasik: sag 0.12, yukari -0.06, ileri -0.35
      var right = new THREE.Vector3(1, 0, 0).applyQuaternion(game.camera.quaternion);
      var up = new THREE.Vector3(0, 1, 0).applyQuaternion(game.camera.quaternion);
      var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(game.camera.quaternion);
      start.add(right.clone().multiplyScalar(0.12));
      start.add(up.clone().multiplyScalar(-0.06));
      start.add(fwd.clone().multiplyScalar(-0.35));
    }

    var end = new THREE.Vector3().copy(start).add(dir.clone().multiplyScalar(len));

    // Use growing line: start with 0 length, grow to full
    var geo = new THREE.BufferGeometry();
    var verts = new Float32Array([
      start.x, start.y + 0.04, start.z,
      start.x, start.y + 0.04, start.z
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));

    var mat = new THREE.LineBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0.9,
      linewidth: 1
    });

    var line = new THREE.Line(geo, mat);
    game.scene.add(line);

    this._tracers.push({
      line: line,
      start: start.clone(),
      end: end.clone(),
      life: 0.12,
      maxLife: 0.12
    });
  },

  update(dt) {
    if (!game || !game.scene || !this._tracers.length) return;
    var scene = game.scene;
    for (var i = this._tracers.length - 1; i >= 0; i--) {
      var t = this._tracers[i];
      t.life -= dt;
      var progress = 1 - t.life / t.maxLife;

      // Line grows from start to end over lifetime (smooth)
      var grow = Math.min(progress * 1.5, 1);
      var curEnd = new THREE.Vector3().copy(t.start).lerp(t.end, grow);
      var posAttr = t.line.geometry.attributes.position;
      var arr = posAttr.array;
      arr[3] = curEnd.x;
      arr[4] = curEnd.y + 0.04;
      arr[5] = curEnd.z;
      posAttr.needsUpdate = true;

      var alpha = Math.sin(progress * Math.PI) * 0.9;
      t.line.material.opacity = Math.max(0, alpha);

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
