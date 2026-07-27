var plugin = include('registry');

plugin.register({
  id: 'fx_tracer',
  name: 'Mermi Tracer',
  type: 'graphics',
  version: '3.1',
  description: 'Ufak isin hedefe gider + namlu isigi',
  priority: 11,

  _tracers: [],
  _lights: [],

  init() {
    this._tracers = [];
    this._lights = [];

    var self = this;
    plugin.on('weapon:fire', this.id, function(data) {
      if (!data || !data.position || !data.direction) return;
      self._add(data.position, data.direction);
      self._muzzleLight(data.position, data.direction);
    });
  },

  _muzzleLight(pos, dir) {
    if (!game || !game.scene) return;

    var p = pos.clone();
    var fp = plugin.get('fx_firstperson');
    if (fp && fp.enabled) {
      var right = new THREE.Vector3(1, 0, 0).applyQuaternion(game.camera.quaternion);
      var up = new THREE.Vector3(0, 1, 0).applyQuaternion(game.camera.quaternion);
      var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(game.camera.quaternion);
      p.add(right.clone().multiplyScalar(0.12));
      p.add(up.clone().multiplyScalar(-0.06));
      p.add(fwd.clone().multiplyScalar(-0.35));
    }

    var light = new THREE.PointLight(0xffaa44, 2, 3);
    light.position.copy(p);
    game.scene.add(light);

    this._lights.push({
      light: light,
      life: 0.06,
      maxLife: 0.06
    });
  },

  _add(pos, dir) {
    if (!game || !game.scene) return;

    var start = pos.clone();
    var fp = plugin.get('fx_firstperson');
    if (fp && fp.enabled) {
      var right = new THREE.Vector3(1, 0, 0).applyQuaternion(game.camera.quaternion);
      var up = new THREE.Vector3(0, 1, 0).applyQuaternion(game.camera.quaternion);
      var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(game.camera.quaternion);
      start.add(right.clone().multiplyScalar(0.12));
      start.add(up.clone().multiplyScalar(-0.06));
      start.add(fwd.clone().multiplyScalar(-0.35));
    }

    var segLen = 0.25;
    var a = new THREE.Vector3().copy(start).add(dir.clone().multiplyScalar(-segLen));
    var b = start.clone();

    var geo = new THREE.BufferGeometry();
    var verts = new Float32Array([
      a.x, a.y + 0.03, a.z,
      b.x, b.y + 0.03, b.z
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
      dir: dir.clone(),
      pos: start.clone(),
      speed: 35,
      life: 0.35,
      maxLife: 0.35
    });
  },

  update(dt) {
    var scene = game ? game.scene : null;
    if (!scene) return;

    // Lights
    for (var i = this._lights.length - 1; i >= 0; i--) {
      var l = this._lights[i];
      l.life -= dt;
      l.light.intensity = (l.life / l.maxLife) * 2;
      if (l.life <= 0) {
        scene.remove(l.light);
        this._lights.splice(i, 1);
      }
    }

    // Tracers
    for (var i = this._tracers.length - 1; i >= 0; i--) {
      var t = this._tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        scene.remove(t.line);
        t.line.geometry.dispose();
        t.line.material.dispose();
        this._tracers.splice(i, 1);
        continue;
      }

      t.pos.x += t.dir.x * t.speed * dt;
      t.pos.y += t.dir.y * t.speed * dt;
      t.pos.z += t.dir.z * t.speed * dt;

      var segLen = 0.25;
      var a = new THREE.Vector3().copy(t.pos).add(t.dir.clone().multiplyScalar(-segLen));
      var b = t.pos;
      var arr = t.line.geometry.attributes.position.array;
      arr[0] = a.x; arr[1] = a.y + 0.03; arr[2] = a.z;
      arr[3] = b.x; arr[4] = b.y + 0.03; arr[5] = b.z;
      t.line.geometry.attributes.position.needsUpdate = true;

      var progress = 1 - t.life / t.maxLife;
      var alpha = Math.sin(progress * Math.PI) * 0.9;
      t.line.material.opacity = Math.max(0, alpha);
    }
  },

  destroy() {
    var scene = game ? game.scene : null;
    for (var i = 0; i < this._lights.length; i++) {
      if (this._lights[i].light && scene) scene.remove(this._lights[i].light);
    }
    for (var i = 0; i < this._tracers.length; i++) {
      if (this._tracers[i].line && scene) scene.remove(this._tracers[i].line);
    }
    this._lights = [];
    this._tracers = [];
    plugin.off('weapon:fire', this.id);
  }
});
