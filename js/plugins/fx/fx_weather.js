var plugin = include('registry');
var cvar = include('cvar');

plugin.register({
  id: 'fx_weather',
  name: 'Hava Durumu',
  type: 'graphics',
  version: '1.0',
  description: 'Yagmur + sis + ruzgar efektleri',
  priority: 5,

  _config: { rain: 0, fog: 0, wind: 0 },
  _rainSystem: null,
  _rainParticles: null,
  _windParticles: null,
  _origFogColor: null,
  _origFogDensity: null,

  setWeather: function(cfg) {
    if (cfg.rain !== undefined) this._config.rain = Math.max(0, Math.min(1, cfg.rain));
    if (cfg.fog !== undefined) this._config.fog = Math.max(0, Math.min(1, cfg.fog));
    if (cfg.wind !== undefined) this._config.wind = Math.max(-1, Math.min(1, cfg.wind));
  },

  init: function(game) {
    this.game = game;

    // Rain texture (small streak)
    var canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 32;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(4, 0, 4, 32);
    grad.addColorStop(0, 'rgba(180,200,255,0)');
    grad.addColorStop(0.3, 'rgba(180,200,255,0.8)');
    grad.addColorStop(0.7, 'rgba(180,200,255,0.6)');
    grad.addColorStop(1, 'rgba(180,200,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 32);
    this._rainTex = new THREE.CanvasTexture(canvas);

    // Wind/dust particle texture
    var wc = document.createElement('canvas');
    wc.width = 12;
    wc.height = 12;
    var wctx = wc.getContext('2d');
    var wg = wctx.createRadialGradient(6, 6, 0, 6, 6, 6);
    wg.addColorStop(0, 'rgba(210,200,180,0.5)');
    wg.addColorStop(1, 'rgba(210,200,180,0)');
    wctx.fillStyle = wg;
    wctx.fillRect(0, 0, 12, 12);
    this._windTex = new THREE.CanvasTexture(wc);

    // Fog
    if (game && game.scene) {
      this._origFogColor = new THREE.Color(0x111122);
      this._origFogDensity = 0.008;
    }
  },

  _ensureRain: function() {
    var count = Math.round(this._config.rain * 3000);
    if (count < 10) {
      if (this._rainSystem) {
        this.game.scene.remove(this._rainSystem);
        this._rainSystem = null;
        this._rainParticles = null;
      }
      return;
    }

    if (this._rainSystem && this._positions && this._positions.length === count * 3) return;

    if (this._rainSystem) {
      this.game.scene.remove(this._rainSystem);
      this._rainSystem = null;
      this._rainParticles = null;
    }

    var positions = new Float32Array(count * 3);
    var velocities = new Float32Array(count * 3);
    var offsets = new Float32Array(count);
    var radius = 30;

    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = Math.sqrt(Math.random()) * radius;
      positions[i*3] = Math.cos(a) * r;
      positions[i*3+1] = Math.random() * 20 + 2;
      positions[i*3+2] = Math.sin(a) * r;
      velocities[i*3] = 0;
      velocities[i*3+1] = -(8 + Math.random() * 6);
      velocities[i*3+2] = 0;
      offsets[i] = Math.random() * 100;
    }

    this._velocities = velocities;
    this._offsets = offsets;

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var mat = new THREE.PointsMaterial({
      map: this._rainTex,
      size: 0.25,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: Math.min(1, 0.3 + this._config.rain * 0.4)
    });

    var system = new THREE.Points(geom, mat);
    system.frustumCulled = false;
    this.game.scene.add(system);
    this._rainSystem = system;
    this._rainParticles = positions;
  },

  update: function(dt) {
    var game = this.game;
    if (!game || !game.scene) return;

    var scene = game.scene;

    // --- Fog ---
    if (this._config.fog > 0) {
      var density = 0.008 + this._config.fog * 0.025;
      var r = 0x11 + Math.round(this._config.fog * 15);
      var g = 0x11 + Math.round(this._config.fog * 10);
      var b = 0x22 + Math.round(this._config.fog * 20);
      scene.fog = new THREE.FogExp2(
        new THREE.Color(r / 255, g / 255, b / 255),
        density
      );
    } else {
      if (scene.fog && scene.fog.density === 0.008) return;
      delete scene.fog;
    }

    // --- Rain ---
    this._ensureRain();
    if (this._rainParticles) {
      var pos = this._rainParticles;
      var vel = this._velocities;
      var playerPos = game.player ? game.player.mesh.position : { x: 0, y: 0, z: 0 };
      var windX = this._config.wind * 4;
      var windZ = this._config.wind * 2;
      var count = pos.length / 3;

      for (var i = 0; i < count; i++) {
        var i3 = i * 3;
        pos[i3] += (vel[i3] + windX) * dt;
        pos[i3+1] += vel[i3+1] * dt;
        pos[i3+2] += (vel[i3+2] + windZ) * dt;

        if (pos[i3+1] < -2) {
          pos[i3] = playerPos.x + (Math.random() - 0.5) * 50;
          pos[i3+1] = 18 + Math.random() * 8;
          pos[i3+2] = playerPos.z + (Math.random() - 0.5) * 50;
        }
      }

      this._rainSystem.geometry.attributes.position.array = pos;
      this._rainSystem.geometry.attributes.position.needsUpdate = true;
      this._rainSystem.position.copy(playerPos);
      this._rainSystem.material.opacity = Math.min(1, 0.3 + this._config.rain * 0.4);
    }

    // --- Wind dust particles ---
    if (this._config.wind !== 0) {
      this._updateWind(dt);
    } else if (this._windParticles) {
      this._removeWind();
    }
  },

  _updateWind: function(dt) {
    var count = 20 + Math.round(Math.abs(this._config.wind) * 30);
    var scene = this.game.scene;
    var playerPos = this.game.player ? this.game.player.mesh.position : { x: 0, y: 0, z: 0 };

    if (!this._windParticles) {
      var positions = new Float32Array(count * 3);
      var sizes = new Float32Array(count);
      var lifetimes = new Float32Array(count);

      for (var i = 0; i < count; i++) {
        positions[i*3] = playerPos.x + (Math.random() - 0.5) * 60;
        positions[i*3+1] = 0.5 + Math.random() * 6;
        positions[i*3+2] = playerPos.z + (Math.random() - 0.5) * 60;
        sizes[i] = 0.3 + Math.random() * 0.6;
        lifetimes[i] = Math.random() * 5;
      }

      this._windLifetimes = lifetimes;
      this._windSizes = sizes;

      var geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      var mat = new THREE.PointsMaterial({
        map: this._windTex,
        size: 0.8,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.5
      });

      var system = new THREE.Points(geom, mat);
      system.frustumCulled = false;
      scene.add(system);
      this._windParticles = system;
    }

    var pos = this._windParticles.geometry.attributes.position.array;
    var lifetimes = this._windLifetimes;
    var windSpeed = this._config.wind * 6;

    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      pos[i3] += windSpeed * dt + (Math.random() - 0.5) * 0.3;
      pos[i3+1] += (Math.random() - 0.5) * 0.2 * dt;
      pos[i3+2] += (Math.random() - 0.5) * 0.3 * dt;
      lifetimes[i] -= dt;

      if (lifetimes[i] <= 0) {
        pos[i3] = playerPos.x + (Math.random() - 0.5) * 40;
        pos[i3+1] = 0.5 + Math.random() * 6;
        pos[i3+2] = playerPos.z + (Math.random() - 0.5) * 40;
        lifetimes[i] = 3 + Math.random() * 4;
      }
    }

    this._windParticles.geometry.attributes.position.array = pos;
    this._windParticles.geometry.attributes.position.needsUpdate = true;
    this._windParticles.position.set(0, 0, 0);
  },

  _removeWind: function() {
    if (!this._windParticles) return;
    this.game.scene.remove(this._windParticles);
    this._windParticles.geometry.dispose();
    this._windParticles.material.dispose();
    this._windParticles = null;
    this._windLifetimes = null;
    this._windSizes = null;
  },

  render2d: function(ctx, w, h) {
    // Rain overlay effect - subtle screen overlay during heavy rain
    if (this._config.rain > 0.3) {
      ctx.fillStyle = 'rgba(100,120,160,' + (this._config.rain * 0.03) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  },

  destroy: function() {
    if (this._rainSystem) {
      this.game.scene.remove(this._rainSystem);
      this._rainSystem.geometry.dispose();
      this._rainSystem.material.dispose();
      this._rainSystem = null;
      this._rainParticles = null;
      this._velocities = null;
      this._offsets = null;
    }
    this._removeWind();
    if (this._rainTex) { this._rainTex.dispose(); this._rainTex = null; }
    if (this._windTex) { this._windTex.dispose(); this._windTex = null; }
    if (this.game && this.game.scene) delete this.game.scene.fog;
  }
});
