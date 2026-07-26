var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'intro_sequence',
  name: 'Giriş Animasyonu',
  type: 'scene',
  version: '4.0',
  description: 'Deadwake sinematik logo giris — isik, partikul, atmosfer',
  enabled: true,
  priority: 50,

  styles: '.intro-overlay{position:fixed;inset:0;z-index:215;background:#000;transition:opacity 1.2s;pointer-events:none;}' +
    '.intro-overlay.hidden{opacity:0;}',

  game: null,
  container: null,
  playing: false,
  elapsed: 0,
  duration: 7,
  logoMesh: null,
  hiddenObjects: [],
  logoLights: [],
  _playerHidden: false,
  _particles: [],
  _swirlParticles: [],
  _logoBob: 0,
  _played: false,
  _introCamera: null,
  _savedCamera: null,

  init(game) {
    this.game = game;
    this.enabled = true;
    loader.loadScript('model_logo', function(){});

    var div = document.createElement('div');
    div.className = 'intro-overlay hidden';
    document.body.appendChild(div);
    this.container = div;

    plugin.on('game:loaded', 'intro_sequence', function() {
      if (this._played) {
        plugin.emit('intro:done');
        return;
      }
      this._played = true;
      this.play();
    }.bind(this));
  },

  play() {
    if (this.playing) return;
    this.playing = true;
    this.elapsed = 0;
    this._particles = [];
    this._swirlParticles = [];

    var self = this;
    var scene = this.game.scene;

    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.025);

    var allChildren = [];
    for (var si = 0; si < scene.children.length; si++) {
      allChildren.push(scene.children[si]);
    }
    for (var si = 0; si < allChildren.length; si++) {
      var child = allChildren[si];
      if (child.isLight) continue;
      child.visible = false;
      this.hiddenObjects.push(child);
    }

    if (this.game.player && this.game.player.mesh) {
      this.game.player.mesh.visible = false;
      this._playerHidden = true;
    }

    // Ambient
    var amb = new THREE.AmbientLight(0x111118, 0.2);
    scene.add(amb);
    this.logoLights.push({ type: 'amb', obj: amb });

    // Spot yukaridan
    var spot = new THREE.SpotLight(0x662222, 0, 10, Math.PI / 5, 0.4, 1);
    spot.position.set(0, 3, 1);
    spot.target.position.set(0, 0, 0);
    scene.add(spot);
    scene.add(spot.target);
    this.logoLights.push({ type: 'spot', obj: spot, target: spot.target });

    // Alt kirmizi glow
    var gl = new THREE.PointLight(0x881111, 0, 5);
    gl.position.set(0, -0.5, 0);
    scene.add(gl);
    this.logoLights.push({ type: 'glow', obj: gl });

    var logoPlugin = plugin.get('model_logo');
    if (logoPlugin && logoPlugin.enabled && logoPlugin.createModel) {
      this.logoMesh = logoPlugin.createModel();
      this.logoMesh.position.set(0, 0, 0);
      this.logoMesh.scale.set(1, 1, 1);
      scene.add(this.logoMesh);

      this._findEyes(this.logoMesh);
      this._hideText();
      this._setEyeOpen(0);
    }

    this._savedCamera = this.game.camera;
    this._introCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    this._introCamera.position.set(0, 0.1, 2);
    this._introCamera.lookAt(0, 0, 0);
    this.game.camera = this._introCamera;
    window.camera = this._introCamera;

    this._resizeHandler = function() {
      if (self._introCamera) {
        self._introCamera.aspect = window.innerWidth / window.innerHeight;
        self._introCamera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', this._resizeHandler);
  },

  _hideText() {
    if (!this.logoMesh) return;
    this.logoMesh.traverse(function(c) {
      if (c.name === 'textDeadwake' || c.name === 'glowTubeL' || c.name === 'glowTubeR') {
        c.visible = false;
      }
    });
  },

  _showText() {
    if (!this.logoMesh) return;
    this.logoMesh.traverse(function(c) {
      if (c.name === 'textDeadwake' || c.name === 'glowTubeL' || c.name === 'glowTubeR') {
        c.visible = true;
      }
    });
  },

  _setTextOpacity(opacity) {
    if (!this.logoMesh) return;
    this.logoMesh.traverse(function(c) {
      if (c.name === 'textDeadwake' && c.material) {
        c.material.opacity = opacity;
      }
    });
  },

  _setEyeGlow(intensity) {
    if (!this.logoMesh) return;
    this.logoMesh.traverse(function(c) {
      if (c.name === 'pupil' && c.material) {
        c.material.emissiveIntensity = intensity;
      }
      if (c.name === 'eyeGlow' && c.material) {
        c.material.opacity = 0.05 + intensity * 0.15;
      }
    });
  },

  _setEyeOpen(amount) {
    if (!this.logoMesh) return;
    var s = 1 - amount;
    this.logoMesh.traverse(function(c) {
      if (c.name === 'eyelidLower') {
        c.scale.y = s;
      }
    });
  },

  _findEyes(obj) {
    this._eyeMeshes = [];
    obj.traverse(function(c) {
      if (c._isEye || c.userData.isEye) {
        this._eyeMeshes.push(c);
      }
    }.bind(this));
  },

  _swirlParticleColor: 0xff4422,

  _spawnSwirlParticle(scene, t) {
    var angle = Math.random() * Math.PI * 2;
    var radius = 0.4 + Math.random() * 0.3;
    var height = (Math.random() - 0.5) * 0.3;
    var geo = new THREE.SphereGeometry(0.008, 4, 4);
    var mat = new THREE.MeshBasicMaterial({
      color: this._swirlParticleColor,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.3
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    mesh.userData.angle = angle;
    mesh.userData.radius = radius;
    mesh.userData.speed = 0.5 + Math.random() * 0.8;
    mesh.userData.heightSpeed = (Math.random() - 0.5) * 0.2;
    mesh.userData.life = 2 + Math.random() * 2;
    scene.add(mesh);
    this._swirlParticles.push(mesh);
  },

  _spawnRisingParticle(scene, dt) {
    if (Math.random() > 0.4) return;
    var geo = new THREE.SphereGeometry(0.006, 3, 3);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xff4422, transparent: true, opacity: 0.15
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 0.6,
      -0.2 + Math.random() * 0.1,
      (Math.random() - 0.5) * 0.6
    );
    mesh.userData.vy = 0.15 + Math.random() * 0.25;
    mesh.userData.life = 2 + Math.random() * 2;
    mesh.userData.vx = (Math.random() - 0.5) * 0.05;
    mesh.userData.vz = (Math.random() - 0.5) * 0.05;
    scene.add(mesh);
    this._particles.push(mesh);
  },

  _updateParticles(scene, dt) {
    for (var pi = this._particles.length - 1; pi >= 0; pi--) {
      var p = this._particles[pi];
      p.userData.life -= dt;
      if (p.userData.life <= 0) {
        scene.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
        this._particles.splice(pi, 1);
        continue;
      }
      p.position.x += p.userData.vx * dt;
      p.position.y += p.userData.vy * dt;
      p.position.z += p.userData.vz * dt;
      p.material.opacity = Math.max(0, (p.userData.life / 3) * 0.2);
    }

    for (var si = this._swirlParticles.length - 1; si >= 0; si--) {
      var s = this._swirlParticles[si];
      s.userData.life -= dt;
      if (s.userData.life <= 0) {
        scene.remove(s);
        if (s.geometry) s.geometry.dispose();
        if (s.material) s.material.dispose();
        this._swirlParticles.splice(si, 1);
        continue;
      }
      s.userData.angle += s.userData.speed * dt;
      s.position.x = Math.cos(s.userData.angle) * s.userData.radius;
      s.position.z = Math.sin(s.userData.angle) * s.userData.radius;
      s.position.y += s.userData.heightSpeed * dt;
      s.material.opacity = Math.max(0, (s.userData.life / 3) * 0.3);
    }
  },

  update(dt) {
    if (!this.playing) return;
    this.elapsed += dt;
    var p = Math.min(this.elapsed / this.duration, 1);
    var scene = this.game.scene;

    // EVRE 1: KARANLIK (p 0.00-0.15 = 0-1s)
    // hicbir sey yok

    // EVRE 2: ISIK DOGUVOR + GOZ AÇILIYOR (p 0.15-0.35 = 1-2.5s)
    if (p >= 0.15 && p < 0.35) {
      var t = (p - 0.15) / 0.2;
      if (this.logoLights[2]) this.logoLights[2].obj.intensity = t * 3;
      if (this.logoLights[1]) this.logoLights[1].obj.intensity = t * 2;
      this._setEyeGlow(t * 0.3);
      this._setEyeOpen(t);
    }

    // EVRE 3: GOZ TAM AÇIK + SWIRL (p 0.35-0.55 = 2.5-4s)
    if (p >= 0.35 && p < 0.55) {
      var t = (p - 0.35) / 0.2;
      if (this.logoLights[1]) this.logoLights[1].obj.intensity = 2 + t;
      this._setEyeGlow(0.3 + t * 0.5);
      this._setEyeOpen(1);
      if (Math.random() < t * 0.5) this._spawnSwirlParticle(scene, p);
    }

    // EVRE 4: YAZI + DETAY (p 0.55-0.70 = 4-5s)
    if (p >= 0.55 && p < 0.70) {
      var t = (p - 0.55) / 0.15;
      this._setEyeGlow(0.8 + t * 0.3);
      if (this.logoLights[2]) this.logoLights[2].obj.intensity = 3 + t;
      if (t > 0.2 && this._textShown !== true) {
        this._showText();
        this._textShown = true;
      }
      this._setTextOpacity(Math.min(t * 3, 1));
    }

    // EVRE 5: NEFES + DONUS (p 0.70-0.85 = 5-6s)
    if (p >= 0.70 && p < 0.85) {
      this._logoBob += dt * 2;
      if (this.logoMesh) {
        this.logoMesh.position.y = Math.sin(this._logoBob) * 0.03;
        this.logoMesh.rotation.y += dt * 0.25;
      }
      var pulse = 0.8 + Math.sin(this.elapsed * 3) * 0.2;
      this._setEyeGlow(pulse);
      if (Math.random() < 0.4) this._spawnSwirlParticle(scene, p);
      if (this.logoLights[2]) this.logoLights[2].obj.intensity = 2.5 + Math.sin(this.elapsed * 2.5) * 0.5;
    }

    // EVRE 6: PARLAKLIK (p 0.85-0.95 = 6-6.5s)
    if (p >= 0.85 && p < 0.95) {
      var t2 = (p - 0.85) / 0.10;
      if (this.logoLights[2]) this.logoLights[2].obj.intensity = 3 + Math.sin(this.elapsed * 3) * 0.3;
      this._setEyeGlow(1 + Math.sin(this.elapsed * 3) * 0.15);
      if (this.logoMesh) this.logoMesh.position.y += Math.sin(this._logoBob) * dt * 0.015;
    }

    // EVRE 7: FADE OUT (p 0.95-1.00 = 6.5-7s)
    if (p >= 0.95) {
      var t2 = Math.min((p - 0.95) / 0.05, 1);
      if (this.logoLights[1]) this.logoLights[1].obj.intensity = 2 * (1 - t2);
      if (this.logoLights[2]) this.logoLights[2].obj.intensity = 3 * (1 - t2);
      this._setEyeGlow(Math.max(0, 1 - t2 * 1.5));
      scene.fog.density = 0.025 + t2 * 0.06;
    }

    this._updateParticles(scene, dt);

    if (p >= 1) {
      this.playing = false;
      this.cleanup();
      plugin.emit('intro:done');
    }
  },

  cleanup() {
    var scene = this.game.scene;

    for (var pi = 0; pi < this._particles.length; pi++) {
      var p = this._particles[pi];
      scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) p.material.dispose();
    }
    this._particles = [];

    for (var si = 0; si < this._swirlParticles.length; si++) {
      var s = this._swirlParticles[si];
      scene.remove(s);
      if (s.geometry) s.geometry.dispose();
      if (s.material) s.material.dispose();
    }
    this._swirlParticles = [];

    if (this.logoMesh) {
      scene.remove(this.logoMesh);
      this.logoMesh.traverse(function(c) {
        if (c.isMesh && c.material) {
          if (c.material.map) c.material.map.dispose();
          c.material.dispose();
        }
      });
      this.logoMesh = null;
    }

    for (var li = 0; li < this.logoLights.length; li++) {
      var l = this.logoLights[li];
      scene.remove(l.obj);
      if (l.target) scene.remove(l.target);
    }
    this.logoLights = [];

    for (var hi = 0; hi < this.hiddenObjects.length; hi++) {
      this.hiddenObjects[hi].visible = true;
    }
    this.hiddenObjects = [];

    if (this._playerHidden && this.game.player && this.game.player.mesh) {
      this.game.player.mesh.visible = true;
      this._playerHidden = false;
    }

    scene.background = new THREE.Color(0x1a0f0a);
    scene.fog = null;

    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }

    if (this._introCamera) {
      this._introCamera = null;
    }

    this.game.camera = this._savedCamera;
    window.camera = this._savedCamera;
    this._savedCamera = null;

    if (!this.game.started) {
      this.game.camera.position.set(0, 18, 12);
      this.game.camera.lookAt(0, 0, 0);
    }

    if (this.container) {
      this.container.classList.add('hidden');
    }
  },

  destroy() {
    this.cleanup();
    if (this.container) document.body.removeChild(this.container);
    plugin.off('game:loaded', this.id);
    plugin.removeStyles(this.id);
  }
});
