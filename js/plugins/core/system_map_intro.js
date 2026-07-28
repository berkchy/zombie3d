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

  styles: '#introOverlay{position:fixed;inset:0;z-index:220;pointer-events:none;display:flex;align-items:center;justify-content:center;}' +
    '#introLoading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 30%,#0d0d14,#07070a);}' +
    '#introLoading.hidden{opacity:0;transition:opacity .4s ease;pointer-events:none;}' +
    '#introLoading .il-card{display:flex;flex-direction:column;align-items:center;gap:14px;}' +
    '#introLoading .il-thumb{width:clamp(120px,16vw,200px);aspect-ratio:4/3;background:#0d0d16;overflow:hidden;border:1px solid rgba(255,255,255,.04);}' +
    '#introLoading .il-thumb img{width:100%;height:100%;object-fit:cover;display:block;}' +
    '#introLoading .il-thumb .ilt-place{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.1);letter-spacing:1px;font-family:monospace;}' +
    '#introLoading .il-name{font-family:\'Fjalla One\',sans-serif;font-size:clamp(18px,2.2vw,24px);color:#fff;letter-spacing:3px;text-transform:uppercase;margin-top:4px;}' +
    '#introLoading .il-bar-track{width:clamp(180px,24vw,280px);height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;}' +
    '#introLoading .il-bar-fill{height:100%;width:0%;background:linear-gradient(90deg,#c62828,#ef5350);border-radius:2px;}' +
    '#introLoading .il-bar-info{display:flex;align-items:center;justify-content:space-between;width:clamp(180px,24vw,280px);font-family:\'Rajdhani\',sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.2);}' +
    '#introLoading .il-bar-pct{color:rgba(255,255,255,.5);font-weight:600;}' +
    '#introTitle{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transform:translateY(20px);transition:all 1s ease;}' +
    '#introTitle.show{opacity:1;transform:translateY(0);}' +
    '#introTitle.hide{opacity:0;transform:translateY(-20px);transition:all .6s ease;}' +
    '#introTitle h1{font-size:clamp(36px,5vw,64px);font-weight:200;letter-spacing:10px;color:#fff;text-transform:uppercase;margin:0;text-shadow:0 0 60px rgba(0,0,0,.8);}' +
    '#introTitle p{font-size:clamp(12px,1.3vw,16px);color:rgba(255,255,255,.3);letter-spacing:4px;margin-top:10px;text-transform:uppercase;font-family:\'Rajdhani\',sans-serif;}' +
    '#introFade{position:fixed;inset:0;z-index:225;background:#000;opacity:0;pointer-events:none;}',

  init(game) {
    this.game = game;

    var ov = document.createElement('div');
    ov.id = 'introOverlay';
    ov.innerHTML =
      '<div id="introLoading" class="hidden">' +
        '<div class="il-card">' +
          '<div class="il-thumb" id="ilThumb"><div class="ilt-place">—</div></div>' +
          '<div class="il-name" id="ilName"></div>' +
          '<div class="il-bar-track"><div class="il-bar-fill" id="ilBarFill"></div></div>' +
          '<div class="il-bar-info"><span class="il-bar-pct" id="ilBarPct">0%</span><span>YÜKLENİYOR</span></div>' +
        '</div>' +
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

    var barFill = document.getElementById('ilBarFill');
    var barPct = document.getElementById('ilBarPct');
    var ready = scenePlugin && (scenePlugin._ready || scenePlugin._loaded);
    var duration = ready ? 2500 : 4000;
    var startTime = performance.now();
    var self = this;

    function animBar() {
      var elapsed = performance.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var pct = Math.round(progress * 100);
      if (barFill) barFill.style.width = pct + '%';
      if (barPct) barPct.textContent = pct + '%';
      if (progress < 1) {
        requestAnimationFrame(animBar);
      } else {
        if (self._state === 'loading') self._onReady();
      }
    }

    requestAnimationFrame(animBar);
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
