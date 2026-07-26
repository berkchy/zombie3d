var plugin = window.include('registry');
var map = window.include('map');

plugin.register({
  id: 'system_map_intro',
  name: 'Harita Giriş Animasyonu',
  type: 'scene',
  version: '2.0',
  description: 'Haritaya girerken yüklenme ekranı, kamera geçişleri ve oyuncuya geçiş',
  priority: 100,

  game: null,
  _state: 'idle',
  _activeMapId: null,
  _introData: null,
  _pathIdx: 0,
  _fadeTimer: 0,
  _holdTimer: 0,
  _fadeState: null,

  styles: '#introOverlay{position:fixed;inset:0;z-index:220;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;}' +
    '#introLoading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0a0a;}' +
    '#introLoading.hidden{opacity:0;transition:opacity .4s ease;pointer-events:none;}' +
    '#introLoading .il-thumb{width:clamp(140px,18vw,220px);aspect-ratio:4/3;border-radius:6px;background:#12121e;overflow:hidden;margin-bottom:18px;}' +
    '#introLoading .il-thumb img{width:100%;height:100%;object-fit:cover;display:block;}' +
    '#introLoading .il-thumb .ilt-place{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.1);letter-spacing:1px;}' +
    '#introLoading .il-name{font-size:clamp(16px,2vw,22px);color:#fff;letter-spacing:1px;margin-bottom:20px;}' +
    '#introLoading .il-spinner{width:24px;height:24px;border:2px solid rgba(255,255,255,.06);border-top-color:#c62828;border-radius:50%;animation:ilSpin .8s linear infinite;margin-bottom:12px;}' +
    '@keyframes ilSpin{to{transform:rotate(360deg)}}' +
    '#introLoading .il-text{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.25);}' +
    '#introTitle{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transform:translateY(20px);transition:all 1s ease;}' +
    '#introTitle.show{opacity:1;transform:translateY(0);}' +
    '#introTitle.hide{opacity:0;transform:translateY(-20px);transition:all .6s ease;}' +
    '#introTitle h1{font-size:clamp(36px,5vw,64px);font-weight:200;letter-spacing:10px;color:#fff;text-transform:uppercase;margin:0;text-shadow:0 0 60px rgba(0,0,0,.8);}' +
    '#introTitle p{font-size:clamp(12px,1.3vw,16px);color:rgba(255,255,255,.3);letter-spacing:4px;margin-top:10px;text-transform:uppercase;}' +
    '#introFade{position:fixed;inset:0;z-index:225;background:#000;opacity:0;pointer-events:none;}',

  init(game) {
    this.game = game;

    var ov = document.createElement('div');
    ov.id = 'introOverlay';
    ov.innerHTML =
      '<div id="introLoading" class="hidden">' +
        '<div class="il-thumb" id="ilThumb"><div class="ilt-place">—</div></div>' +
        '<div class="il-name" id="ilName"></div>' +
        '<div class="il-spinner"></div>' +
        '<div class="il-text">Harita yükleniyor</div>' +
      '</div>' +
      '<div id="introTitle"></div>' +
      '<div id="introFade"></div>';
    document.body.appendChild(ov);
    this._overlay = ov;
    this._fadeEl = document.getElementById('introFade');

    var self = this;
    plugin.on('map:entered', 'system_map_intro', function(data) {
      if (data && data.mapId) self._begin(data.mapId);
    });
  },

  _begin: function(mapId) {
    this._activeMapId = mapId;
    var mapDef = map.get(mapId);
    if (!mapDef) { this._finish(); return; }

    // Poligon haritasinda intro animasyonunu atla
    if (mapDef.mode === 'polygon') {
      this._finish();
      return;
    }

    var scenePlugin = plugin.get(mapDef.scenePluginId);
    this._introData = (scenePlugin && typeof scenePlugin.getIntroData === 'function') ? scenePlugin.getIntroData() : null;

    var nameEl = document.getElementById('ilName');
    if (nameEl) nameEl.textContent = mapDef.name || mapDef.id;

    map.renderThumbnail(mapId, 220, 165, function(url) {
      var thumb = document.getElementById('ilThumb');
      if (thumb && url) thumb.innerHTML = '<img src="' + url + '" alt="">';
    });

    this._state = 'loading';
    document.getElementById('introLoading').classList.remove('hidden');

    var ready = scenePlugin && (scenePlugin._ready || scenePlugin._loaded);
    var delay = ready ? 600 : 1500;
    setTimeout(function() {
      if (this._state === 'loading') this._onReady();
    }.bind(this), delay);
  },

  _onReady: function() {
    var loadEl = document.getElementById('introLoading');
    loadEl.classList.add('hidden');
    setTimeout(function() { loadEl.style.display = 'none'; }, 700);

    var mapDef = map.get(this._activeMapId);
    var titleEl = document.getElementById('introTitle');
    if (mapDef) {
      titleEl.innerHTML = '<h1>' + (mapDef.name || mapDef.id) + '</h1>' +
        (mapDef.modeDescription ? '<p>' + mapDef.modeDescription + '</p>' : '');
    }
    setTimeout(function() { titleEl.classList.add('show'); }, 100);

    setTimeout(function() {
      titleEl.classList.remove('show');
      titleEl.classList.add('hide');
      this._startCameraPath();
    }.bind(this), 2500);
  },

  _startCameraPath: function() {
    var data = this._introData;
    if (!data || !data.cameraPath || data.cameraPath.length === 0) {
      this._finish();
      return;
    }

    this._pathIdx = 0;
    this._state = 'camera_fade_out';
    this._fadeTimer = 0;
  },

  _nextCamera: function() {
    this._pathIdx++;
    if (this._pathIdx >= this._introData.cameraPath.length) {
      this._finish();
    } else {
      this._state = 'camera_fade_out';
      this._fadeTimer = 0;
    }
  },

  update: function(dt) {
    if (this._state === 'idle' || this._state === 'loading') return;

    var cam = this.game.camera;

    if (this._state === 'camera_fade_out') {
      var seg = this._introData.cameraPath[this._pathIdx];
      var fadeTime = (seg.fadeTime || seg.fadeIn || 0.5);
      this._fadeTimer += dt;
      var t = Math.min(this._fadeTimer / fadeTime, 1);
      this._fadeEl.style.opacity = t;
      if (t >= 1) {
        // Snap camera to position
        cam.position.set(seg.pos[0], seg.pos[1], seg.pos[2]);
        cam.lookAt(seg.target[0], seg.target[1], seg.target[2]);
        this._state = 'camera_hold';
        this._holdTimer = 0;
        // Start fade in
        this._fadeState = 'fade_in';
        this._fadeTimer = 0;
      }
      return;
    }

    if (this._state === 'camera_hold') {
      var seg = this._introData.cameraPath[this._pathIdx];
      var fadeTime = (seg.fadeTime || seg.fadeOut || 0.5);

      if (this._fadeState === 'fade_in') {
        this._fadeTimer += dt;
        var t = Math.min(this._fadeTimer / fadeTime, 1);
        this._fadeEl.style.opacity = 1 - t;
        if (t >= 1) this._fadeState = 'idle';
      }

      this._holdTimer += dt;
      var dur = seg.duration || 2;
      if (this._holdTimer >= dur) {
        this._fadeState = null;
        this._nextCamera();
      }
      return;
    }
  },

  _finish: function() {
    this._state = 'idle';
    this._fadeEl.style.opacity = 0;
    var titleEl = document.getElementById('introTitle');
    if (titleEl) { titleEl.classList.remove('show', 'hide'); titleEl.innerHTML = ''; }
    var ov = document.getElementById('introOverlay');
    if (ov) ov.style.display = 'none';
    plugin.emit('intro:map_done');
  },

  destroy() {
    if (this._overlay) document.body.removeChild(this._overlay);
    plugin.off('map:entered', this.id);
  }
});
