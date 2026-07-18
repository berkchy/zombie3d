var scene, camera, renderer, overlayCtx;
var game;
var lastTime = 0;
var running = false;
var gameStarted = false;
var _fpsFrames = 0, _fpsTimer = 0, _currentFps = 0;
var _crashMessages = [];  // son çökme mesajlari, fallback icin

// En basta console.error'u sar — crashGame erken cagrilabilir olsun
(function() {
  var origError = console.error;
  console.error = function() {
    var args = Array.prototype.slice.call(arguments);
    var msg = args.join(' ');
    origError.apply(console, args);
    if (typeof crashGame === 'function') crashGame('console', 'error', new Error(msg));
  };
})();

// Devconsole'a dogrudan DOM'a yazarak mesaj ekle (console override'a guvenme)
function devconsoleLog(type, msg) {
  _crashMessages.push({ type: type, msg: msg });
  var body = document.getElementById('devconsole-body');
  if (!body) return;
  var div = document.createElement('div');
  div.className = 'log-' + type;
  div.textContent = msg;
  body.appendChild(div);
  if (body.children.length > 200) body.removeChild(body.firstChild);
  body.scrollTop = body.scrollHeight;
}

// Plugin çökme — oyunu durdur, konsolu aç
function crashGame(pluginId, phase, error) {
  running = false;
  gameStarted = false;
  var all = PluginRegistry.getAll();
  var crashedPlugin = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === pluginId) {
      all[i]._crashed = true;
      all[i]._crashError = (error && error.message) ? error.message : (error || '');
      all[i]._crashPhase = phase;
      crashedPlugin = all[i];
      break;
    }
  }
  if (game) {
    game._crashed = true;
    game.paused = false;
  }

  var loading = document.getElementById('loadingScreen');
  if (loading) {
    loading.classList.add('hidden');
    setTimeout(function() { loading.classList.add('done'); }, 500);
  }

  devconsoleLog('error', '========================================');
  devconsoleLog('error', '[CRASH] Plugin: ' + pluginId + ' | Faz: ' + phase);
  devconsoleLog('error', '[CRASH] Hata: ' + (error.message || error));
  if (error.stack) devconsoleLog('error', error.stack);
  devconsoleLog('error', '========================================');

  if (renderer) {
    try { renderer.dispose(); } catch(e) {}
  }
  var container = document.getElementById('gameContainer');
  if (container) {
    container.style.display = 'none';
    var canvases = container.querySelectorAll('canvas');
    for (var c = 0; c < canvases.length; c++) {
      canvases[c].remove();
    }
  }
  var overlays = document.querySelectorAll('.menu-overlay, .intro-overlay, .pause-overlay, #hud, #gameOver, #joystick-area');
  for (var k = 0; k < overlays.length; k++) {
    overlays[k].style.display = 'none';
  }

  var errMsg = error && error.message ? error.message : String(error || '');
  var stackStr = error && error.stack ? error.stack : '';

  var fb = document.getElementById('crashFallback');
  if (fb) fb.remove();

  fb = document.createElement('div');
  fb.id = 'crashFallback';

  var pluginName = crashedPlugin ? (crashedPlugin.name || crashedPlugin.id) : pluginId;
  var pluginVersion = crashedPlugin && crashedPlugin.version ? 'v' + crashedPlugin.version : '';
  var pluginInfo = crashedPlugin ? pluginId + ' (' + pluginName + ') ' + pluginVersion : pluginId;

  var lines = stackStr.split('\n');
  var compactStack = [];
  for (var s = 0; s < lines.length; s++) {
    var line = lines[s].trim();
    if (line && line.indexOf('http') !== -1) {
      var urlMatch = line.match(/(https?:\/\/[^\s)]+)/);
      if (urlMatch) {
        var url = urlMatch[1];
        var filePart = url.split('/').pop() || url;
        var lineMatch = line.match(/:(\d+):(\d+)/);
        if (lineMatch) {
          compactStack.push(filePart + ':' + lineMatch[1] + ':' + lineMatch[2]);
        } else {
          compactStack.push(filePart);
        }
      } else {
        compactStack.push(line);
      }
    } else if (line) {
      compactStack.push(line);
    }
  }

  fb.innerHTML =
    '<div class="cs-wrap">' +
      '<div class="cs-icon">⚠</div>' +
      '<h1 class="cs-title">OYUN ÇÖKTÜ</h1>' +
      '<div class="cs-divider"></div>' +
      '<div class="cs-section">' +
        '<div class="cs-label">EKLENTİ</div>' +
        '<div class="cs-value">' + pluginInfo + '</div>' +
      '</div>' +
      '<div class="cs-section">' +
        '<div class="cs-label">FAZ</div>' +
        '<div class="cs-value">' + phase + '</div>' +
      '</div>' +
      '<div class="cs-section">' +
        '<div class="cs-label">HATA</div>' +
        '<div class="cs-value cs-error" style="white-space:pre-wrap">' + _escapeHtml(errMsg) + '</div>' +
      '</div>' +
      (compactStack.length > 0 ? (
        '<div class="cs-section">' +
          '<div class="cs-label">STACK</div>' +
          '<div class="cs-stack">' + compactStack.map(function(l) { return '<div class="cs-stack-line">' + _escapeHtml(l) + '</div>'; }).join('') + '</div>' +
        '</div>'
      ) : '') +
      '<div class="cs-divider"></div>' +
      '<button class="cs-btn" onclick="location.reload()">YENİDEN BAŞLAT</button>' +
    '</div>';

  var style = document.createElement('style');
  style.id = 'cs-style';
  style.textContent =
    '#crashFallback{position:fixed;inset:0;z-index:99999;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;}' +
    '#crashFallback .cs-wrap{max-width:600px;width:90%;padding:clamp(24px,4vw,48px);}' +
    '#crashFallback .cs-icon{font-size:clamp(32px,4vw,48px);margin-bottom:8px;opacity:.3;}' +
    '#crashFallback .cs-title{font-family:\'Fjalla One\',sans-serif;font-size:clamp(36px,5vw,64px);font-weight:400;letter-spacing:4px;color:#c62828;margin:0 0 4px;text-transform:uppercase;}' +
    '#crashFallback .cs-divider{width:40px;height:1px;background:rgba(255,255,255,.08);border:none;margin:20px 0;}' +
    '#crashFallback .cs-section{margin-bottom:12px;}' +
    '#crashFallback .cs-label{font-size:clamp(9px,1vw,11px);letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.2);margin-bottom:2px;}' +
    '#crashFallback .cs-value{font-size:clamp(12px,1.3vw,14px);color:rgba(255,255,255,.7);word-break:break-all;}' +
    '#crashFallback .cs-error{color:#ef5350;}' +
    '#crashFallback .cs-stack{margin-top:4px;max-height:160px;overflow-y:auto;background:rgba(255,255,255,.03);border-radius:4px;padding:8px 10px;}' +
    '#crashFallback .cs-stack-line{font-family:monospace;font-size:clamp(9px,1vw,11px);color:rgba(255,255,255,.35);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '#crashFallback .cs-stack::-webkit-scrollbar{width:3px;}' +
    '#crashFallback .cs-stack::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px;}' +
    '#crashFallback .cs-btn{background:none;border:1px solid rgba(198,40,40,.3);color:#c62828;font-family:inherit;font-size:clamp(11px,1.2vw,13px);letter-spacing:2px;text-transform:uppercase;padding:10px 28px;border-radius:4px;cursor:pointer;transition:all .25s;margin-top:4px;}' +
    '#crashFallback .cs-btn:hover{background:rgba(198,40,40,.08);border-color:#c62828;}';

  document.head.appendChild(style);
  document.body.appendChild(fb);

  // Howler seslerini durdur
  try { if (typeof Howler !== 'undefined') Howler.stop(); } catch(e) {}

  // Devconsole'u da ac (arka planda)
  setTimeout(function() {
    var panel = document.getElementById('devconsole');
    var btn = document.getElementById('devconsole-btn');
    if (panel) panel.classList.add('open');
    if (btn) btn.classList.add('open');
  }, 200);

  throw error;
}

function _escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Yatay FOV sabitleme (dikey/yatay ayni goruntu)
window._targetHfov = 60;

window._applyHfov = function() {
  var hfov = window._targetHfov || 60;
  var aspect = window.innerWidth / window.innerHeight;
  var vfov = 2 * Math.atan(Math.tan(hfov * Math.PI / 360) / aspect) * 180 / Math.PI;
  camera.fov = vfov;
  camera.updateProjectionMatrix();
};

function init() {
  document.getElementById('loadingScreen').classList.remove('hidden');

  PluginLoader.loadIni('plugins.ini', function(err) {
    if (err) {
      document.querySelector('.loader-text').textContent = 'HATA: ' + err;
      crashGame('PluginLoader', 'loadIni', err);
      return;
    }

    var total = PluginLoader.getEntries().length;
    var loaded = 0;
    var fill = document.querySelector('.loader-fill');
    var status = document.getElementById('loadStatus');
    var pluginName = document.getElementById('loadPlugin');

    function updateLoader(current, t, path, pluginInfo) {
      var pct = (current / t) * 100;
      if (fill) fill.style.width = pct + '%';
      if (status) status.textContent = current + ' / ' + t;
      if (pluginName && path) {
        if (pluginInfo && pluginInfo.name) {
          pluginName.textContent = pluginInfo.name;
          if (pluginInfo.version) pluginName.textContent += ' v' + pluginInfo.version;
          if (pluginInfo.description) pluginName.textContent += ' — ' + pluginInfo.description;
        } else {
          pluginName.textContent = path.split('/').pop().replace(/\.js$/i, '');
        }
      }
    }

    // Pluginleri yükle (progress callback'li)
    PluginLoader.loadAll(function(results) {
      // ---------- Plugin yukleme hatasi — crash ----------
      if (results.errors.length > 0) {
        var errMsg = 'Plugin yuklenemedi: ' + results.errors.join(', ');

        var pending = PluginLoader.getPendingErrors();

        var detailLines = ['Plugin yukleme hatalari:'];
        pending.forEach(function(e) {
          detailLines.push('  ' + e.path + ': ' + e.message);
        });
        errMsg = detailLines.join('\n');

        var dc = PluginRegistry.get('ui_devconsole');
        if (dc && !dc._loaded) {
          try { dc.init(null); } catch (e) {}
          dc._loaded = true;
        }
        pending.forEach(function(e) {
          devconsoleLog('error', '[PluginLoader] ' + e.path + ': ' + e.message);
          if (e.stack) devconsoleLog('error', e.stack);
        });
        devconsoleLog('error', '[CRASH] ' + errMsg);

        crashGame('PluginLoader', 'loadAll', new Error(errMsg));
        return;
      }

      // ---------- Three.js ----------
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x3a3a4a);
      scene.fog = null;

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 18, 12);
      camera.lookAt(0, 0, 0);
      window.camera = camera;
      scene.add(camera);
      try { var f = PluginCvarAPI.get('camera_fov'); if (f) window._targetHfov = f; } catch(e) {}
      window._applyHfov();

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      document.getElementById('gameContainer').insertBefore(
        renderer.domElement, document.getElementById('gameContainer').firstChild
      );

      // ---------- 2D Overlay ----------
      var overlayCanvas = document.getElementById('overlay');
      overlayCanvas.width = window.innerWidth;
      overlayCanvas.height = window.innerHeight;
      overlayCtx = overlayCanvas.getContext('2d');

      // ---------- Resize ----------
      window.addEventListener('resize', function() {
        window._applyHfov();
        renderer.setSize(window.innerWidth, window.innerHeight);
        overlayCanvas.width = window.innerWidth;
        overlayCanvas.height = window.innerHeight;
      });

      // ---------- Game Object ----------
      game = {
        scene: scene,
        camera: camera,
        renderer: renderer,
        player: null,
        playerMesh: null,
        score: 0,
        _lastScore: 0,
        _tickTimer: 0,
        elapsed: 0,
        gameOverFlag: false,
        _dying: false,
        _dyingTimer: 0,
        paused: false,
        plugins: [],
        started: false,
        poligonMode: false,
        currentMap: null,
        overlayCtx: overlayCtx,

        shoot: function(owner) {
          // Hotbar kontrolu — sadece secili slot'taki silah ates eder
          if (game.hotbar) {
            var sel = game.hotbar.getSelected();
            if (sel && sel.slot && sel.slot.id) {
              var weapons = PluginRegistry.getByType('weapon');
              for (var i = 0; i < weapons.length; i++) {
                if (weapons[i].id === sel.slot.id) {
                  if (weapons[i].shoot) weapons[i].shoot(owner);
                  break;
                }
              }
            }
            return;
          }
          // Hotbar yoksa eski davranis (tum weapon pluginleri)
          var weapons = PluginRegistry.getByType('weapon');
          weapons.forEach(function(wp) {
            if (wp.shoot) wp.shoot(owner);
          });
        },

        gameOver: function() {
          if (this.gameOverFlag) return;
          if (!gameStarted) return;
          this.gameOverFlag = true;
          this.paused = false;
          gameStarted = false;
          this.started = false;
          document.getElementById('finalScore').textContent = this.score;
          var wm = PluginRegistry.get('system_wave_manager');
          document.getElementById('finalWave').textContent = this.poligonMode ? 'POLIGON' : (wm ? String(wm.wave) : '1');
          document.getElementById('gameOver').classList.add('show');

          camera.position.set(0, 18, 12);
          camera.lookAt(0, 0, 0);

          PluginRegistry.emit('game:over');
        },

        goToMenu: function() {
          var wui = document.getElementById('waveUI');
          if (wui) wui.classList.remove('show');
          this.restart();
        },

        restart: function() {
          document.getElementById('gameOver').classList.remove('show');
          this.score = 0;
          this.elapsed = 0;
          this.gameOverFlag = false;
          this._dying = false;
          this.paused = false;
          this._tickTimer = 0;
          this._lastScore = 0;
          document.getElementById('scoreVal').textContent = '0';
          document.getElementById('hpFill').style.width = '100%';

          this.plugins.forEach(function(p) {
            try {
              if (p.destroy) p.destroy();
            } catch (e) {
              crashGame(p.id, 'destroy', e);
            }
          });

          while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
          }

          this.poligonMode = false;
          this.plugins = [];
          this.player = null;
          this.playerMesh = null;
          this.currentMap = null;
          running = false;
          gameStarted = false;
          lastTime = 0;

          // Tum pluginleri yeniden baslatilmaya hazirla
          PluginRegistry.getAll().forEach(function(p) { p._loaded = false; p._crashed = false; });

          reloadPlugins();
          PluginRegistry.emit('game:loaded');
          PluginRegistry.emit('game:restart');
        },

        pause: function() {
          if (this.paused || this.gameOverFlag) return;
          this.paused = true;
          PluginRegistry.emit('game:pause');
        },

        resume: function() {
          if (!this.paused) return;
          this.paused = false;
          lastTime = performance.now();
          PluginRegistry.emit('game:resume');
        },

        togglePause: function() {
          if (this.paused) this.resume(); else this.pause();
        },

        disconnect: function() {
          if (!gameStarted) return;
          this.paused = false;
          gameStarted = false;
          var self = this;
          setTimeout(function() { self.restart(); }, 50);
        }
      };

      window.Game = game;

      document.getElementById('menuBtn').addEventListener('click', function() {
        game.goToMenu();
      });

      // ESC tuşu ile pause
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && game && game.togglePause) {
          game.togglePause();
        }
      });

      // ---------- Hook yönlendirmeleri ----------
    PluginRegistry.on('menu:play', '__engine__', function(data) {
      var mapDef = data && data.mapId ? MapRegistry.get(data.mapId) : null;
      if (!mapDef) {
        devconsoleLog('error', '[Engine] Harita bulunamadi: ' + (data && data.mapId));
        crashGame('engine', 'menu:play', new Error('Harita bulunamadi: ' + (data && data.mapId)));
        return;
      }
      game.currentMap = mapDef;
      game.poligonMode = (mapDef.mode === 'polygon');

      // Player'i spawn noktasina koy
      var spawn = mapDef.playerSpawn || [0, 0, 0];
      if (game.player && game.player.mesh) {
        game.player.mesh.position.set(spawn[0], spawn[1], spawn[2]);
        game.player.hp = game.player.maxHp || 100;
        document.getElementById('hpFill').style.width = '100%';
      }

      PluginRegistry.emit('map:entered', { mapId: mapDef.id });
    });

    PluginRegistry.on('intro:map_done', '__engine__', function() {
      startGame();
    });

    PluginRegistry.on('player:dying', '__engine__', function(data) {
      game._dying = true;
      game._dyingTimer = 0;
    });

      // Pluginleri başlat (bu sirada map pluginleri loadScript ile sub-plugin yukleyebilir)
      reloadPlugins();

      function _finishLoading() {
        ls.classList.add('hidden');
        setTimeout(function() { ls.classList.add('done'); }, 600);
        // Script hataları
        var pending = PluginLoader.getPendingErrors();
        if (pending.length > 0) {
          pending.forEach(function(e) {
            devconsoleLog('error', '[PluginLoader] ' + e.path + ': ' + e.message);
            if (e.stack) devconsoleLog('error', e.stack);
          });
          setTimeout(function() {
    var panel = document.getElementById('devconsole');
    var btn = document.getElementById('devconsole-btn');
    if (panel) {
      panel.classList.add('open');
      var body = document.getElementById('devconsole-body');
      if (body) body.scrollTop = body.scrollHeight;
    }
    if (btn) btn.classList.add('open');
          }, 100);
        }
        PluginRegistry.emit('game:loaded');
      }

      var ls = document.getElementById('loadingScreen');
      var lst = document.querySelector('.loader-text');
      var lstatus = document.getElementById('loadStatus');
      var lplugin = document.getElementById('loadPlugin');
      var lfill = document.querySelector('.loader-fill');

      if (PluginLoader.hadSubLoads()) {
        PluginLoader.startSubQueue();
        PluginLoader.setSubProgressCallback(function(done, total, path, err) {
          if (lfill) lfill.style.width = (done / total * 100) + '%';
          if (lstatus) lstatus.textContent = done + ' / ' + total;
          if (lplugin && path) {
            var pluginId = path.split('/').pop().replace(/\.js$/i, '');
            var info = PluginRegistry.get(pluginId);
            if (info && info.name) {
              lplugin.textContent = info.name;
              if (info.version) lplugin.textContent += ' v' + info.version;
              if (info.description) lplugin.textContent += ' — ' + info.description;
            } else {
              lplugin.textContent = pluginId + (err ? ' (HATA)' : '');
            }
          }
        });

        var _subMinTime = Date.now() + 1000;

        function _checkSubDone() {
          if (!PluginLoader.hasPendingLoads() && Date.now() >= _subMinTime) {
            PluginLoader.setSubProgressCallback(null);
            _finishLoading();
            return true;
          }
          return false;
        }

        if (!_checkSubDone()) {
          var waitForSub = setInterval(function() {
            if (_checkSubDone()) {
              clearInterval(waitForSub);
            }
          }, 100);
        }
      } else {
        _finishLoading();
      }
    }, updateLoader);
  });
}

function reloadPlugins() {
  try {
    var allPlugins = PluginRegistry.getAll();

    var order = { core: 0, map: 1, player: 2, weapon: 3, enemy: 4, graphics: 5, ui: 6, menu: 7, scene: 8 };
    var sorted = allPlugins
      .filter(function(p) { return p.enabled; })
      .sort(function(a, b) {
        var oa = order[a.type] || 99;
        var ob = order[b.type] || 99;
        if (oa !== ob) return oa - ob;
        return (a.priority || 0) - (b.priority || 0);
      });

    sorted.forEach(function(plugin) {
      if (plugin.init && !plugin._loaded) {
        try {
          if (plugin.type === 'scene') console.log('[reloadPlugins] init scene: ' + plugin.id);
          plugin.init(game);
        } catch (e) {
          plugin._crashed = true;
          crashGame(plugin.id, 'init', e);
          return;
        }
        plugin._loaded = true;
        game.plugins.push(plugin);
        // Stiller destroy() ile silindiyse yeniden ekle
        if (plugin.styles) {
          var sid = 'plugin-style-' + plugin.id;
          if (!document.getElementById(sid)) {
            var st = document.createElement('style');
            st.id = sid;
            st.textContent = plugin.styles;
            document.head.appendChild(st);
          }
        }
        console.log('[OK] ' + plugin.id + ' (' + plugin.type + ') v' + (plugin.version || '1.0'));
      }
    });

    if (game && game._crashed) return;
    running = true;
    lastTime = performance.now();

    // Intro eklentisi yoksa direkt menüyü göster
    var introPlugin = PluginRegistry.get('intro_sequence');
    if (!introPlugin || !introPlugin.enabled) {
      PluginRegistry.emit('intro:done');
    }

    requestAnimationFrame(loop);
  } catch (e) {
    devconsoleLog('error', '[Engine] reloadPlugins: ' + e.message);
    if (e.stack) devconsoleLog('error', e.stack);
    crashGame('engine', 'reloadPlugins', e);
  }
}

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  if (game) game.started = true;

  document.getElementById('hpFill').style.width = '100%';

  var spawn = game.currentMap && game.currentMap.playerSpawn ? game.currentMap.playerSpawn : [0, 0, 0];

  if (game.player && game.player.mesh) {
    game.player.mesh.position.set(spawn[0], spawn[1], spawn[2]);
    game.player.hp = game.player.maxHp || 100;
    document.getElementById('hpFill').style.width = '100%';
  }

  // Poligon modu ayarlari
  if (game.poligonMode) {
    if (game.hotbar) {
      game.hotbar.clearAll();
      var weapons = PluginRegistry.getByType('weapon');
      for (var wi = 0; wi < weapons.length; wi++) {
        var result = game.hotbar.addItem(weapons[wi].id);
        if (!result) break;
      }
      if (weapons.length > 0) game.hotbar.selectSlot(0);
    }
    weapons.forEach(function(w) {
      w.ammo = 999;
      w.maxAmmo = 999;
    });
    var sel = game.hotbar ? game.hotbar.getSelected() : null;
    if (sel) PluginRegistry.emit('ammo:change', { ammo: 999, maxAmmo: 999, clip: 999 });
  } else {
    if (game.hotbar) {
      game.hotbar.clearAll();
      var weapons = PluginRegistry.getByType('weapon');
      if (weapons.length > 0) {
        game.hotbar.setSlot(0, weapons[0].id);
        game.hotbar.selectSlot(0);
      }
    }
  }

  game.score = 0;
  game.elapsed = 0;
  game.gameOverFlag = false;
  game._dying = false;
  PluginRegistry.emit('game:start');
}

// ---------- Ana Döngü ----------
function loop(time) {
  if (!running) return;

  var dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (gameStarted && !game.paused) game.elapsed += dt;

  // Dinamik script hatalarini kontrol et (loadScript ile yuklenen pluginler)
  var pending = PluginLoader.getPendingErrors();
  if (pending.length > 0) {
    pending.forEach(function(e) {
      devconsoleLog('error', '[PluginLoader] ' + e.path + ': ' + e.message);
      if (e.stack) devconsoleLog('error', e.stack);
    });
    var panel = document.getElementById('devconsole');
    var btn = document.getElementById('devconsole-btn');
    if (panel) panel.classList.add('open');
    if (btn) btn.classList.add('open');
  }

  // game:tick her saniye
  if (game && game._tickTimer !== undefined) {
    game._tickTimer += dt;
    if (game._tickTimer >= 1) {
      game._tickTimer -= 1;
      PluginRegistry.emit('game:tick', { elapsed: game.elapsed });
    }
  }

  // score değişim takibi
  if (game && game._lastScore !== undefined && game.score !== game._lastScore) {
    game._lastScore = game.score;
    PluginRegistry.emit('score:change', { score: game.score });
  }

  var allPlugins = PluginRegistry.getEnabled().sort(function(a, b) {
    var order = { core: 0, map: 1, player: 2, weapon: 3, enemy: 4, graphics: 5, ui: 6, menu: 7, scene: 8 };
    var oa = order[a.type] || 99;
    var ob = order[b.type] || 99;
    if (oa !== ob) return oa - ob;
    return (a.priority || 0) - (b.priority || 0);
  });
  for (var i = 0; i < allPlugins.length; i++) {
    var p = allPlugins[i];
    if (!p.update || !p._loaded) continue;
    if (!gameStarted && p.type !== 'ui' && p.type !== 'menu' && p.type !== 'scene') continue;
    if (game.paused && p.type !== 'ui' && p.type !== 'menu' && p.type !== 'scene') continue;
    if (game && game._dying && p.type !== 'core' && p.type !== 'ui') continue;
    try {
      p.update(dt);
    } catch (e) {
      crashGame(p.id, 'update', e);
      return;
    }
  }

  // Animasyon guncellemesi (tip filtresini atla)
  var animPlugin = PluginRegistry.get('core_animation');
  if (animPlugin && animPlugin.enabled && animPlugin.update && animPlugin._loaded) {
    try { animPlugin.update(dt); } catch (e) { crashGame('core_animation', 'update', e); return; }
  }

  // --- KAMERA ---
  if (game.player && game.player.mesh && gameStarted && !game._dying) {
    var fp = PluginRegistry.get('fx_firstperson');
    if (fp && fp.enabled) {
      // First person: kamerayi oyuncu kafasina yerlestir
      var pos = game.player.mesh.position;
      camera.position.set(pos.x, pos.y + 0.6, pos.z);
      var yaw = game.fpYaw || 0;
      var pitch = game.fpPitch || 0;
      var euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);
      game.player.mesh.rotation.y = yaw;

      // Oyuncu govdesini gizle (bacaklar kalsin)
      var hip = game.player.mesh.getObjectByName('hip');
      if (hip) {
        var torsoN = hip.getObjectByName('torso');
        if (torsoN && torsoN.visible !== false) torsoN.visible = false;
      }

      // View model overlay kamerasi ana kamerayla senkronize edilir
      if (fp.syncMainCamera) fp.syncMainCamera(camera);
    } else {
      // Third person
      var pos = game.player.mesh.position;
      camera.position.x += (pos.x - camera.position.x) * 0.08;
      camera.position.z += (pos.z + 12 - camera.position.z) * 0.08;
      camera.lookAt(pos.x, 0, pos.z);

      // Oyuncu govdesini goster
      var hip = game.player.mesh.getObjectByName('hip');
      if (hip) {
        var torsoN = hip.getObjectByName('torso');
        if (torsoN && torsoN.visible !== true) torsoN.visible = true;
      }

      // View modeli gizle
      var vm = camera.getObjectByName('fp_viewmodel');
      if (vm && vm.visible) vm.visible = false;
    }
  }

  // Olum ani zoom
  if (game && game._dying && game.player && game.player.mesh) {
    game._dyingTimer += dt;
    var dieLen = 0.7;
    var zoomLen = 1.5;

    var fp = PluginRegistry.get('fx_firstperson');
    if (fp && fp.enabled) {
      // First person: kamera basi egilsin (yere dussun)
      if (game._dyingTimer > dieLen) {
        var t = Math.min((game._dyingTimer - dieLen) / zoomLen, 1);
        var ppos = game.player.mesh.position;
        camera.position.set(ppos.x, (ppos.y + 0.6) * (1 - t * 0.8), ppos.z);
        camera.quaternion.slerp(new THREE.Quaternion().setFromEuler(
          new THREE.Euler(-Math.PI / 4, 0, 0)
        ), t * 0.5);
      }
    } else {
      var total = dieLen + zoomLen;
      if (game._dyingTimer > dieLen) {
        var t = (game._dyingTimer - dieLen) / zoomLen;
        if (t > 1) t = 1;
        var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var ppos = game.player.mesh.position;
        camera.position.x += (ppos.x - camera.position.x) * 0.05;
        camera.position.y = 18 + (1.2 - 18) * ease;
        camera.position.z = ppos.z + 12 + (2.8 - 12) * ease;
        camera.lookAt(ppos.x, 0.4, ppos.z);
      }
    }

    if (game._dyingTimer >= dieLen + zoomLen) {
      game._dying = false;
      game.gameOver();
    }
  }

  // 3D ses listener'ini kamerayla senkronize et
  if (game && game.sound && game.sound.updateListener) {
    try { game.sound.updateListener(camera); } catch(e) {}
  }

  renderer.render(scene, camera);

  // View model overlay pass — ayri sahne, depth temizlenip uste bindirilir
  var fp = PluginRegistry.get('fx_firstperson');
  if (fp && fp.enabled && fp._overlayScene && fp._overlayCamera && gameStarted && fp._viewGroup) {
    fp.syncMainCamera(camera);
    renderer.autoClear = false;
    renderer.clear(false, true, false);
    renderer.render(fp._overlayScene, fp._overlayCamera);
    renderer.autoClear = true;
  }

  overlayCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  var allPlugins2 = PluginRegistry.getEnabled();
  for (var j = 0; j < allPlugins2.length; j++) {
    var p2 = allPlugins2[j];
    if (!p2.render2d || !p2._loaded) continue;
    if (game && game.testRoomActive) continue;
    if (!gameStarted) continue;
    if (game.paused && p2.type !== 'ui' && p2.type !== 'menu' && p2.type !== 'scene') continue;
    try {
      p2.render2d(overlayCtx, window.innerWidth, window.innerHeight);
    } catch (e) {
      crashGame(p2.id, 'render2d', e);
      return;
    }
  }

  // FPS sayaci
  _fpsFrames++;
  _fpsTimer += dt;
  if (_fpsTimer >= 0.5) {
    _currentFps = Math.round(_fpsFrames / _fpsTimer);
    _fpsFrames = 0;
    _fpsTimer = 0;
    var fpsEl = document.getElementById('fps-counter');
    if (fpsEl) fpsEl.textContent = 'FPS: ' + _currentFps;
  }

  requestAnimationFrame(loop);
}

init();
