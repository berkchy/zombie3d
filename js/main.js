var scene, camera, renderer, overlayCtx;
var game;
var lastTime = 0;
var running = false;
var gameStarted = false;

// Plugin çökme — oyunu durdur, konsolu aç
function crashGame(pluginId, phase, error) {
  running = false;
  gameStarted = false;
  if (game) {
    game._crashed = true;
    game.paused = false;
  }

  // Loading ekranını kapat
  var loading = document.getElementById('loadingScreen');
  if (loading) {
    loading.classList.add('hidden');
    setTimeout(function() { loading.classList.add('done'); }, 500);
  }

  console.error('========================================');
  console.error('[CRASH] Plugin: ' + pluginId);
  console.error('[CRASH] Faz: ' + phase);
  console.error('[CRASH] Hata: ' + (error.message || error));
  console.error('[CRASH] Stack: ' + (error.stack || ''));
  console.error('========================================');

  // Renderer'ı temizle + tüm oyun görsellerini kaldır
  if (renderer) {
    try { renderer.dispose(); } catch(e) {}
  }
  var container = document.getElementById('gameContainer');
  if (container) {
    container.style.display = 'none';
    // Canvas'ı DOM'dan çıkar
    var canvases = container.querySelectorAll('canvas');
    for (var c = 0; c < canvases.length; c++) {
      canvases[c].remove();
    }
  }
  var overlays = document.querySelectorAll('.menu-overlay, .intro-overlay, .pause-overlay, #hud, #gameOver, #joystick-area');
  for (var k = 0; k < overlays.length; k++) {
    overlays[k].style.display = 'none';
  }

  // Konsolu aç (devconsole henüz init olmamış olabilir, gecikmeli dene)
  var errorMsg = '[' + phase + '] ' + pluginId + ': ' + (error.message || error);
  setTimeout(function() {
    var panel = document.getElementById('devconsole');
    var btn = document.getElementById('devconsole-btn');
    if (panel) panel.classList.add('open');
    if (btn) btn.classList.add('open');

    // Devconsole yoksa fallback göster
    if (!panel || !panel.classList.contains('open')) {
      var fb = document.getElementById('crashFallback');
      if (!fb) {
        fb = document.createElement('div');
        fb.id = 'crashFallback';
        fb.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0a0505;color:#ef5350;font-family:monospace;font-size:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center;';
        fb.innerHTML = '<h2 style="color:#ef5350;margin-bottom:20px;font-size:20px;">PLUGIN ÇÖKTÜ</h2>' +
          '<pre style="color:#ffa726;margin-bottom:10px;">' + errorMsg + '</pre>' +
          '<pre style="color:#888;font-size:11px;max-width:600px;white-space:pre-wrap;">' + (error.stack || '') + '</pre>';
        document.body.appendChild(fb);
      }
    }
  }, 200);
}
function init() {
  document.getElementById('loadingScreen').classList.remove('hidden');

  PluginLoader.loadIni('plugins.ini', function(err) {
    if (err) {
      console.error(err);
      document.querySelector('.loader-text').textContent = 'HATA: ' + err;
      return;
    }

    var total = PluginLoader.getEntries().length;
    var loaded = 0;
    var fill = document.querySelector('.loader-fill');
    var status = document.getElementById('loadStatus');
    var pluginName = document.getElementById('loadPlugin');

    function updateLoader(current, t, path) {
      var pct = (current / t) * 100;
      if (fill) fill.style.width = pct + '%';
      if (status) status.textContent = current + ' / ' + t;
      if (pluginName && path) pluginName.textContent = path.split('/').pop();
    }

    // Pluginleri yükle (progress callback'li)
    PluginLoader.loadAll(function(results) {
      // ---------- Three.js ----------
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a0f0a);
      scene.fog = new THREE.Fog(0x1a0f0a, 25, 40);

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 18, 12);
      camera.lookAt(0, 0, 0);

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
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
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
        paused: false,
        plugins: [],
        started: false,
        poligonMode: false,
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
          document.getElementById('finalScore').textContent = this.score;
          document.getElementById('finalWave').textContent = this.poligonMode ? 'POLIGON' : document.getElementById('waveVal').textContent;
          document.getElementById('gameOver').classList.add('show');

          PluginRegistry.emit('game:over');
        },

        restart: function() {
          document.getElementById('gameOver').classList.remove('show');
          this.score = 0;
          this.elapsed = 0;
          this.gameOverFlag = false;
          this.paused = false;
          this._tickTimer = 0;
          this._lastScore = 0;
          document.getElementById('scoreVal').textContent = '0';
          document.getElementById('waveVal').textContent = '1';
          document.getElementById('waveLabel').innerHTML = 'Dalga <span id="waveVal">1</span>';
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
          running = false;
          gameStarted = false;
          lastTime = 0;

          // Tum pluginleri yeniden baslatilmaya hazirla
          PluginRegistry.getAll().forEach(function(p) { p._loaded = false; p._crashed = false; });

          reloadPlugins();
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
        }
      };

      window.Game = game;

      document.getElementById('menuBtn').addEventListener('click', function() {
        game.restart();
      });

      // ESC tuşu ile pause
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && game && game.togglePause) {
          game.togglePause();
        }
      });

      // ---------- Hook yönlendirmeleri ----------
    PluginRegistry.on('menu:play', '__engine__', function() {
      game.poligonMode = false;
      startGame();
    });

    PluginRegistry.on('menu:poligon', '__engine__', function() {
      game.poligonMode = true;
      startGame();
    });

      // Loading ekranını kapat
      document.getElementById('loadingScreen').classList.add('hidden');
      setTimeout(function() {
        document.getElementById('loadingScreen').classList.add('done');
      }, 600);

      // Pluginleri başlat
      reloadPlugins();

      // Script hatalarını devconsole'a aktar (devconsole artık init oldu)
      var pending = PluginLoader.getPendingErrors();
      if (pending.length > 0) {
        pending.forEach(function(e) {
          console.error('[PluginLoader] Hata:', e.path, '-', e.message);
          if (e.stack) console.error(e.stack);
        });
        // Konsolu otomatik aç
        setTimeout(function() {
          var panel = document.getElementById('devconsole');
          var btn = document.getElementById('devconsole-btn');
          if (panel) panel.classList.add('open');
          if (btn) btn.classList.add('open');
        }, 100);
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

    PluginRegistry.emit('game:loaded');

    // Intro eklentisi yoksa direkt menüyü göster
    var introPlugin = PluginRegistry.get('intro_sequence');
    if (!introPlugin || !introPlugin.enabled) {
      PluginRegistry.emit('intro:done');
    }

    requestAnimationFrame(loop);
  } catch (e) {
    console.error('[Engine] reloadPlugins beklenmeyen hata:', e.message);
    console.error(e.stack);
    crashGame('engine', 'reloadPlugins', e);
  }
}

function startGame() {
  if (gameStarted) return;
  gameStarted = true;

  document.getElementById('hud').classList.add('show');

  if (game.player && game.player.mesh) {
    game.player.mesh.position.set(0, 0, 0);
    game.player.hp = game.player.maxHp || 100;
    document.getElementById('hpFill').style.width = '100%';
  }

  // Poligon modu ayarlari
  if (game.poligonMode) {
    document.getElementById('waveLabel').textContent = 'POLIGON';
    // Tabancayi slot 0'a yerlestir ve sec
    if (game.hotbar) {
      game.hotbar.setSlot(0, 'weapon_pistol');
      game.hotbar.selectSlot(0);
    }
  } else {
    document.getElementById('waveLabel').textContent = 'Dalga <span id="waveVal">1</span>';
  }

  game.score = 0;
  game.elapsed = 0;
  game.gameOverFlag = false;
  PluginRegistry.emit('game:start');
}

// ---------- Ana Döngü ----------
function loop(time) {
  if (!running) return;

  var dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (gameStarted && !game.paused) game.elapsed += dt;

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

  var allPlugins = PluginRegistry.getEnabled();
  for (var i = 0; i < allPlugins.length; i++) {
    var p = allPlugins[i];
    if (!p.update || !p._loaded) continue;
    if (!gameStarted && p.type !== 'ui' && p.type !== 'menu' && p.type !== 'scene') continue;
    if (game.paused && p.type !== 'ui' && p.type !== 'menu' && p.type !== 'scene') continue;
    try {
      p.update(dt);
    } catch (e) {
      crashGame(p.id, 'update', e);
      return;
    }
  }

  if (game.player && game.player.mesh && gameStarted) {
    var pos = game.player.mesh.position;
    camera.position.x += (pos.x - camera.position.x) * 0.08;
    camera.position.z += (pos.z + 12 - camera.position.z) * 0.08;
    camera.lookAt(pos.x, 0, pos.z);
  }

  renderer.render(scene, camera);

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

  requestAnimationFrame(loop);
}

init();
