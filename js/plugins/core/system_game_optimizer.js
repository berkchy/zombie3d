var plugin = window.include('registry');
var cvar = window.include('cvar');

plugin.register({
  id: 'system_game_optimizer',
  name: 'Oyun Optimize',
  type: 'core',
  version: '1.0',
  description: 'Pixel ratio, shadow/far plane/fog cvars + otomatik cleanup ile FPS artisi',
  enabled: true,
  priority: 80,

  game: null,
  _fpsQualityTimer: 0,
  _adaptive: false,
  _currShadowMapSize: 512,
  _debug: false,

  init(game) {
    this.game = game;
    this._debug = plugin.get(this.id).debug;

    var DPR = Math.min(window.devicePixelRatio, 2);

    cvar.register('r_pixelratio', 1.5, 'number', 'Pixel ratio siniri (0=sinirsiz, max 2)');
    cvar.register('r_shadows', 1, 'number', 'Golge kalitesi (0=kapali, 1=yumusak, 2=sert)');
    cvar.register('r_farplane', 60, 'number', 'Goruntuleme mesafesi (20-100)');
    cvar.register('r_fog', false, 'boolean', 'Sis efekti');
    cvar.register('r_shadowmapsize', 512, 'number', 'Golge haritasi boyutu (256/512/1024)');
    cvar.register('r_adaptive', false, 'boolean', 'FPS dusunce otomatik kalite dusur');

    this._applyPixelRatio();
    this._applyShadows();
    this._applyFarPlane();
    this._applyFog();
    this._applyShadowMapSize();

    var self = this;
    cvar.onChange('r_pixelratio', function() { self._applyPixelRatio(); });
    cvar.onChange('r_shadows', function() { self._applyShadows(); });
    cvar.onChange('r_farplane', function() { self._applyFarPlane(); });
    cvar.onChange('r_fog', function() { self._applyFog(); });
    cvar.onChange('r_shadowmapsize', function() { self._applyShadowMapSize(); });
    cvar.onChange('r_adaptive', function(v) { self._adaptive = v; });

    this._adaptive = cvar.get('r_adaptive') || false;

    if (this._debug) devconsoleLog('log', '[Optimizer] Baslatildi | pixelRatio=' + renderer.getPixelRatio() + ' shadows=' + renderer.shadowMap.type + ' far=' + camera.far);
  },

  _applyPixelRatio() {
    if (!renderer) return;
    var val = cvar.get('r_pixelratio');
    var DPR = window.devicePixelRatio || 1;
    if (val === undefined || val === null || val <= 0) {
      renderer.setPixelRatio(Math.min(DPR, 2));
    } else {
      renderer.setPixelRatio(Math.min(DPR, val));
    }
    if (this._debug) devconsoleLog('log', '[Optimizer] pixelRatio: ' + renderer.getPixelRatio());
  },

  _applyShadows() {
    if (!renderer) return;
    var val = cvar.get('r_shadows');
    if (val === undefined || val === null) val = 1;
    val = Math.max(0, Math.min(2, Math.round(val)));

    if (val === 0) {
      renderer.shadowMap.enabled = false;
    } else {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = val === 1 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    }
    if (this._debug) devconsoleLog('log', '[Optimizer] shadows: ' + (val === 0 ? 'off' : (val === 1 ? 'soft' : 'hard')));
  },

  _applyFarPlane() {
    if (!camera) return;
    var val = cvar.get('r_farplane');
    if (val !== undefined && val !== null) {
      camera.far = Math.max(20, Math.min(100, val));
      camera.updateProjectionMatrix();
    }
  },

  _applyFog() {
    if (!scene) return;
    var val = cvar.get('r_fog');
    var enabled = val === undefined || val === null || val;
    if (enabled) {
      if (!scene.fog) scene.fog = new THREE.Fog(0x1a0f0a, 25, 40);
    } else {
      scene.fog = null;
    }
  },

  _applyShadowMapSize() {
    if (!scene) return;
    var val = cvar.get('r_shadowmapsize');
    if (val === undefined || val === null) val = 512;
    var size = Math.max(256, Math.min(1024, Math.round(val)));
    this._currShadowMapSize = size;

    scene.traverse(function(n) {
      if (n.isLight && n.shadow) {
        n.shadow.mapSize.width = size;
        n.shadow.mapSize.height = size;
        if (n.shadow.map) n.shadow.map.dispose();
        n.shadow.map = null;
      }
    });

    if (this._debug) devconsoleLog('log', '[Optimizer] shadowMapSize: ' + size);
  },

  update(dt) {
    if (!game || !gameStarted) return;
    this._fpsQualityTimer += dt;

    if (this._fpsQualityTimer >= 3) {
      this._fpsQualityTimer = 0;

      // Adaptive quality based on FPS
      if (this._adaptive && typeof _currentFps !== 'undefined') {
        if (_currentFps < 25) {
          var pr = cvar.get('r_pixelratio');
          if (pr === undefined || pr === null || pr > 1) cvar.set('r_pixelratio', 1);
          var sm = cvar.get('r_shadowmapsize');
          if (sm === undefined || sm === null || sm > 256) cvar.set('r_shadowmapsize', 256);
          if (this._debug) devconsoleLog('log', '[Optimizer] FPS dusuk (' + _currentFps + '), kalite dustu');
        } else if (_currentFps > 55) {
          cvar.set('r_pixelratio', 1.5);
          cvar.set('r_shadowmapsize', 512);
        }
      }

      // Periodic: ensure frustum culling on all meshes
      var fixed = 0;
      scene.traverse(function(n) {
        if (n.isMesh && n.frustumCulled === false) {
          n.frustumCulled = true;
          fixed++;
        }
      });
      if (fixed > 0 && this._debug) devconsoleLog('log', '[Optimizer] ' + fixed + ' mesh frustumCulled duzeltildi');
    }
  },

  destroy() {
    var off = cvar.offChange;
    try { off('r_pixelratio', this._applyPixelRatio); } catch(e) {}
    try { off('r_shadows', this._applyShadows); } catch(e) {}
    try { off('r_farplane', this._applyFarPlane); } catch(e) {}
    try { off('r_fog', this._applyFog); } catch(e) {}
    try { off('r_shadowmapsize', this._applyShadowMapSize); } catch(e) {}
    try { off('r_adaptive'); } catch(e) {}
    this.game = null;
  }
});
