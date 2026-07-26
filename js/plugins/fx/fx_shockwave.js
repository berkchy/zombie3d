var plugin = include('registry');
var registry = include('registry');

var _allThinks = [];

function WaveThink(id, opts) {
  this.id = id;
  this.elapsed = 0;
  this.duration = opts.duration || 0.8;
  this.maxRadius = opts.maxRadius || 3;
  this.position = opts.position || { x: 0, y: 0, z: 0 };
  this.active = true;
  _allThinks.push(this);
  registry.emit('shockwave:start', {
    id: id, position: this.position,
    maxRadius: this.maxRadius, duration: this.duration
  });
}

WaveThink.prototype.tick = function(dt) {
  if (!this.active) return false;
  this.elapsed += dt;
  var t = Math.min(1, this.elapsed / this.duration);
  var r = t * this.maxRadius;
  registry.emit('shockwave:expand', {
    id: this.id, progress: t, radius: r,
    position: this.position
  });
  if (t >= 1) {
    this.active = false;
    registry.emit('shockwave:end', { id: this.id, position: this.position });
    return false;
  }
  return true;
};

window.WaveThink = WaveThink;
WaveThink.tickAll = tickAllThinks;

function tickAllThinks(dt) {
  for (var i = _allThinks.length - 1; i >= 0; i--) {
    if (!_allThinks[i].tick(dt)) {
      _allThinks.splice(i, 1);
    }
  }
}

plugin.register({
  id: 'fx_shockwave',
  name: 'Şok Dalgası',
  type: 'graphics',
  version: '1.0',
  description: 'Genişleyen çember dalga efekti (HL1 shockwave) — WaveThink otomatik tick',
  enabled: true,
  priority: 10,

  _waves: [],

  init(game) {
    this._game = game;
    this._waves = [];
    this._nextId = 0;
  },

  shockwave(position, options) {
    options = options || {};
    var maxRadius = options.maxRadius || 3;
    var height = options.height || 0.3;
    var color = options.color || 0x88ccff;
    var duration = options.duration || 0.8;
    var opacity = options.opacity !== undefined ? options.opacity : 0.8;

    var torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, height * 0.3, 8, 32),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity }
        },
        vertexShader: [
          'varying float vZ;',
          'void main() {',
          '  vZ = position.z;',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
          '}'
        ].join('\n'),
        fragmentShader: [
          'uniform vec3 uColor;',
          'uniform float uOpacity;',
          'varying float vZ;',
          'void main() {',
          '  float halfH = ' + (height * 0.3 + 0.001).toFixed(4) + ';',
          '  float alpha = 1.0 - abs(vZ) / halfH;',
          '  alpha = clamp(alpha, 0.0, 1.0) * uOpacity;',
          '  gl_FragColor = vec4(uColor, alpha);',
          '}'
        ].join('\n')
      })
    );
    torus.rotation.x = -Math.PI / 2;
    torus.position.set(position.x, position.y + height * 0.15, position.z);
    this._game.scene.add(torus);

    var wid = 'shockwave_' + (this._nextId++);
    new WaveThink(wid, {
      duration: duration, maxRadius: maxRadius, position: position
    });

    this._waves.push({
      id: wid, mesh: torus,
      elapsed: 0, duration: duration, maxRadius: maxRadius,
      height: height, opacity: opacity
    });

    return wid;
  },

  update(dt) {
    tickAllThinks(dt);

    for (var i = this._waves.length - 1; i >= 0; i--) {
      var w = this._waves[i];
      w.elapsed += dt;
      var t = Math.min(1, w.elapsed / w.duration);

      if (t >= 1) {
        this._game.scene.remove(w.mesh);
        w.mesh.geometry.dispose();
        w.mesh.material.dispose();
        this._waves.splice(i, 1);
        continue;
      }

      var radius = t * w.maxRadius;
      w.mesh.geometry.dispose();
      w.mesh.geometry = new THREE.TorusGeometry(radius, w.height * 0.3, 8, 32);
      w.mesh.material.uniforms.uOpacity.value = (1 - t) * w.opacity;
    }
  },

  destroy() {
    for (var i = 0; i < this._waves.length; i++) {
      var w = this._waves[i];
      if (w.mesh.parent) w.mesh.parent.remove(w.mesh);
      w.mesh.geometry.dispose();
      w.mesh.material.dispose();
    }
    this._waves = [];
  }
});
