var plugin = window.include('registry');
var map = window.include('map');

plugin.register({
  id: 'system_map_intro',
  name: 'Harita Giriş Animasyonu',
  type: 'scene',
  version: '1.0',
  description: 'Haritaya girerken yüklenme ekranı, kamera animasyonu ve oyuncuya geçiş',
  priority: 100,

  game: null,
  _state: 'idle',
  _activeMapId: null,
  _introData: null,
  _timer: 0,
  _pathIdx: 0,
  _pathT: 0,
  _fromPos: null,
  _fromTarget: null,
  _toPos: null,
  _toTarget: null,

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
    '#introTitle p{font-size:clamp(12px,1.3vw,16px);color:rgba(255,255,255,.3);letter-spacing:4px;margin-top:10px;text-transform:uppercase;}',

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
      '<div id="introTitle"></div>';
    document.body.appendChild(ov);
    this._overlay = ov;

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

    // Loading ekranina harita adini yaz
    var nameEl = document.getElementById('ilName');
    if (nameEl) nameEl.textContent = mapDef.name || mapDef.id;

    // Thumbnail render et
    map.renderThumbnail(mapId, 220, 165, function(url) {
      var thumb = document.getElementById('ilThumb');
      if (thumb && url) {
        thumb.innerHTML = '<img src="' + url + '" alt="">';
      }
    });

    this._state = 'loading';
    document.getElementById('introLoading').classList.remove('hidden');

    // Plugin hazirsa kisa yukleme, degilse biraz bekle
    var ready = scenePlugin && (scenePlugin._ready || scenePlugin._loaded);
    var delay = ready ? 600 : 1500;
    setTimeout(function() {
      if (this._state === 'loading') this._onReady();
    }.bind(this), delay);
  },

  _checkReady: function() {
    var mapDef = map.get(this._activeMapId);
    if (!mapDef) { this._finish(); return; }

    var scenePlugin = plugin.get(mapDef.scenePluginId);
    if (scenePlugin && (scenePlugin._ready || scenePlugin._loaded)) {
      this._onReady();
    } else {
      setTimeout(this._checkReady.bind(this), 100);
    }
  },

  _onReady: function() {
    // Loading ekranini kapat
    var loadEl = document.getElementById('introLoading');
    loadEl.classList.add('hidden');
    setTimeout(function() {
      loadEl.style.display = 'none';
    }, 700);

    // Title + description goster
    var mapDef = map.get(this._activeMapId);
    var titleEl = document.getElementById('introTitle');
    if (mapDef) {
      titleEl.innerHTML = '<h1>' + (mapDef.name || mapDef.id) + '</h1>' +
        (mapDef.modeDescription ? '<p>' + mapDef.modeDescription + '</p>' : '');
    }
    setTimeout(function() {
      titleEl.classList.add('show');
    }, 100);

    // Kamera path'ini baslat
    setTimeout(function() {
      titleEl.classList.remove('show');
      titleEl.classList.add('hide');
      this._startCameraPath();
    }.bind(this), 3500);
  },

  _startCameraPath: function() {
    var data = this._introData;
    if (!data || !data.cameraPath || data.cameraPath.length === 0) {
      this._startAbovePlayer();
      return;
    }

    this._state = 'camera_path';
    this._pathIdx = 0;
    this._pathT = 0;
    this._timer = data.cameraPath[0].duration || 2;
    this._setupPathSegment(0);
  },

  _setupPathSegment: function(idx) {
    var seg = this._introData.cameraPath[idx];
    if (!seg) return;
    this._fromPos = this._fromPos || new THREE.Vector3().copy(this.game.camera.position);
    this._fromTarget = this._fromTarget || new THREE.Vector3(0, 0, 0);
    this._toPos = new THREE.Vector3(seg.pos[0], seg.pos[1], seg.pos[2]);
    this._toTarget = new THREE.Vector3(seg.target[0], seg.target[1], seg.target[2]);
    this._timer = seg.duration || 2;
    this._pathT = 0;
  },

  update: function(dt) {
    if (this._state === 'idle' || this._state === 'loading') return;

    var cam = this.game.camera;

    if (this._state === 'camera_path') {
      this._pathT += dt;
      var seg = this._introData.cameraPath[this._pathIdx];
      var dur = seg.duration || 2;
      var t = Math.min(this._pathT / dur, 1);
      var et = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out

      cam.position.lerpVectors(this._fromPos, this._toPos, et);
      var tgt = new THREE.Vector3().lerpVectors(this._fromTarget, this._toTarget, et);
      cam.lookAt(tgt);

      if (t >= 1) {
        this._pathIdx++;
        if (this._pathIdx >= this._introData.cameraPath.length) {
          this._startAbovePlayer();
        } else {
          this._fromPos.copy(this._toPos);
          this._fromTarget.copy(this._toTarget);
          this._setupPathSegment(this._pathIdx);
        }
      }
      return;
    }

    if (this._state === 'above_player') {
      var mapDef = map.get(this._activeMapId);
      var spawn = (mapDef && mapDef.playerSpawn) || [0, 0, 0];
      var ah = (this._introData && this._introData.aboveHeight) || 4;
      var abovePos = new THREE.Vector3(spawn[0], spawn[1] + ah, spawn[2] + 4);

      // Yukaridan player'a bak
      cam.position.copy(abovePos);
      cam.lookAt(spawn[0], spawn[1] + 0.5, spawn[2]);

      this._aboveTimer -= dt;
      if (this._aboveTimer <= 0) {
        this._startZoom();
      }
      return;
    }

    if (this._state === 'zoom') {
      var mapDef = map.get(this._activeMapId);
      var spawn = (mapDef && mapDef.playerSpawn) || [0, 0, 0];
      var ah = (this._introData && this._introData.aboveHeight) || 4;
      var fromY = spawn[1] + ah;
      var toY = spawn[1] + 0.6;

      this._zoomTimer -= dt;
      var t = Math.max(0, this._zoomTimer / this._zoomDuration);
      var et = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
      et = 1 - et; // reverse: slow first then fast

      var y = fromY + (toY - fromY) * et;
      cam.position.set(spawn[0], y, spawn[2] + 4 * (1 - et));
      cam.lookAt(spawn[0], spawn[1] + 0.5, spawn[2]);

      if (this._zoomTimer <= 0) {
        this._finish();
      }
      return;
    }
  },

  _startAbovePlayer: function() {
    this._state = 'above_player';
    this._aboveTimer = 2;
  },

  _startZoom: function() {
    this._state = 'zoom';
    this._zoomDuration = 1.8;
    this._zoomTimer = this._zoomDuration;
  },

  _finish: function() {
    this._state = 'idle';
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
