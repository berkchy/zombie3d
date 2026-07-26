var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'entity_dropbox',
  name: 'Drop Kutusu',
  type: 'core',
  version: '1.1',
  description: 'Havadan süzülen drop kutusu — rasgele silah veya cephane verir',
    styles: '#caseReveal{position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;pointer-events:auto;opacity:0;transition:opacity .35s ease;}#caseReveal.visible{opacity:1;}' +
    '#caseReveal .case-bg{position:absolute;inset:0;background:rgba(0,0,0,.85);}' +
    '#caseReveal .case-stage{position:relative;z-index:1;width:480px;transform:scale(.85);opacity:0;transition:transform .35s cubic-bezier(.17,.67,.29,1.3),opacity .35s ease;}' +
    '#caseReveal.visible .case-stage{transform:scale(1);opacity:1;}' +
    '#caseReveal .case-wheel{position:relative;height:220px;overflow:hidden;border-radius:12px;background:rgba(10,10,18,.6);border:1px solid rgba(255,255,255,.06);}' +
    '#caseReveal .case-vignette{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3;background:linear-gradient(90deg,rgba(10,10,18,.6) 0%,transparent 12%,transparent 88%,rgba(10,10,18,.6) 100%);}' +
    '#caseReveal .case-track{display:flex;height:100%;width:640px;will-change:transform;}' +
    '#caseReveal .case-track.noanim{transition:none!important;}' +
    '#caseReveal .case-col{flex:none;width:160px;display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box;border-right:1px solid rgba(255,255,255,.04);}' +
    '#caseReveal .case-col:last-child{border-right:none;}' +
    '#caseReveal .cc-card{display:flex;flex-direction:column;align-items:center;gap:6px;}' +
    '#caseReveal .cc-img{width:110px;height:110px;border-radius:10px;object-fit:contain;background:rgba(255,255,255,.02);display:block;}' +
    '#caseReveal .cc-name{font-size:11px;color:rgba(255,255,255,.3);font-weight:bold;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;}' +
    '#caseReveal .case-col.active .cc-name{color:#4fc3f7;text-shadow:0 0 12px rgba(79,195,247,.5);}' +
    '#caseReveal .case-col.active .cc-img{box-shadow:0 0 18px rgba(79,195,247,.3);}' +
    '#caseReveal .case-indicator{position:absolute;top:0;left:50%;transform:translateX(-50%);width:2px;height:220px;background:#4fc3f7;box-shadow:0 0 20px rgba(79,195,247,.6);z-index:2;pointer-events:none;}' +
    '#caseReveal .case-result{position:absolute;top:0;left:0;width:100%;height:220px;display:none;flex-direction:column;align-items:center;justify-content:center;z-index:4;}' +
    '#caseReveal .case-result.show{display:flex;animation:caseRevealIn .5s cubic-bezier(.17,.67,.29,1.3) forwards;}' +
    '#caseReveal .case-result.show ~ .case-track{opacity:0;transition:opacity .25s;}' +
    '#caseReveal .case-result.show ~ .case-vignette{opacity:0;transition:opacity .25s;}' +
    '#caseReveal .case-result.show ~ .case-indicator{opacity:0;transition:opacity .25s;}' +
    '@keyframes caseRevealIn{0%{opacity:0;transform:scale(.5) rotate(-5deg)}100%{opacity:1;transform:scale(1) rotate(0)}}' +
    '#caseReveal .result-glow{width:160px;height:160px;border-radius:50%;position:absolute;filter:blur(50px);opacity:.4;pointer-events:none;}' +
    '#caseReveal .result-img{width:80px;height:80px;border-radius:10px;object-fit:contain;display:block;margin:0 auto 8px;background:rgba(255,255,255,.03);}' +
    '#caseReveal .result-card{background:rgba(20,20,30,.95);border:2px solid rgba(255,255,255,.1);border-radius:14px;padding:16px 22px;max-width:240px;position:relative;z-index:4;}' +
    '#caseReveal .result-rarity{font-size:9px;letter-spacing:4px;text-transform:uppercase;margin-bottom:2px;font-weight:bold;}' +
    '#caseReveal .result-name{font-size:20px;font-weight:bold;color:#fff;}' +
    '#caseReveal .result-desc{font-size:11px;color:rgba(255,255,255,.45);}' +
    '#caseReveal .case-track.sliding{transition:transform .12s ease;}',

  game: null,
  _dropbox: null,
  _timer: 0,
  _interactCooldown: 0,
  _colliders: [],
  _revealing: false,
  _pendingLoot: null,

  init(game) {
    loader.loadScript('model_dropbox', function(){});
    this.game = game;
    this._dropbox = null;
    this._timer = 0;
    this._interactCooldown = 0;
    this._colliders = [];

    var self = this;

    var _sndRegistered = false;
    plugin.on('game:loaded', this.id + '_snd', function() {
      if (_sndRegistered || !game.sound) return;
      _sndRegistered = true;
      game.sound.addSound('dropbox_falling', {
        label: 'Dropbox Düşüyor', cat: 'ekstra',
        variants: [{ src: ['audio/dropbox_falling.mp3'], volume: 0.6, loop: true }]
      });
      game.sound.addSound('dropbox_fell', {
        label: 'Dropbox Düştü', cat: 'ekstra',
        variants: [{ src: ['audio/dropbox_fell.mp3'], volume: 0.7 }]
      });
      game.sound.addSound('dropbox_opened', {
        label: 'Dropbox Açıldı', cat: 'ekstra',
        variants: [{ src: ['audio/dropbox_opened.mp3'], volume: 0.7 }]
      });
      game.sound.addSound('case_open', {
        label: 'Kasa Açılıyor', cat: 'ekstra',
        variants: [{ src: ['audio/case_open.mp3'], volume: 0.6 }]
      });
      game.sound.addSound('case_spin_tick', {
        label: 'Kasa Dönüş Tik', cat: 'ekstra',
        variants: [{ src: ['audio/case_spin_tick.mp3'], volume: 0.35 }]
      });
      game.sound.addSound('case_reveal', {
        label: 'Kasa Sonuç', cat: 'ekstra',
        variants: [{ src: ['audio/case_reveal.mp3'], volume: 0.7 }]
      });
    });
    this._keyHandler = function(e) {
      if (e.key.toLowerCase() === 'e' && self._interactCooldown <= 0) {
        self._interactCooldown = 0.3;
        self._tryInteract();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
    this._interactBtn = null;

    plugin.on('map:entered', this.id, function() {
      self._reset();
      self._loadColliders();
    });
    plugin.on('game:over', this.id, function() {
      self._reset();
    });

    var touch = plugin.get('system_touch_buttons');
    if (touch && touch.enabled) {
      this._interactBtn = touch.touchAdd('interact', {
        label: '',
        html: '<svg viewBox="0 0 40 40" width="28" height="28" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20 L18 36 C18 37.5 19 38 20 38 C21 38 22 37.5 22 36 L22 28"/><path d="M22 28 L22 10 C22 7 20 5 18 5 C16 5 14 7 14 10 L14 24"/><path d="M14 24 L12 22 C10 20 8 21 8 23 L8 25 C8 27 10 28 12 28 L14 28"/><path d="M22 24 L26 22 C28 20 30 21 30 23 L30 25 C30 27 28 28 26 28 L22 28"/></svg>',
        x: 0, y: 0,
        width: 64, height: 64,
        shape: 'circle',
        bgColor: 'rgba(255,193,7,.55)',
        color: '#fff',
        zIndex: 200,
        hidden: true,
        onClick: function() {
          if (self._interactCooldown > 0) return;
          self._interactCooldown = 0.3;
          self._tryInteract();
        }
      });
    }
  },

  _loadColliders() {
    this._colliders = [];
    if (!game.currentMap) return;
    var mapPluginId = 'map_' + game.currentMap.id;
    var map = plugin.get(mapPluginId);
    if (map && typeof map.getColliders === 'function') {
      try { this._colliders = map.getColliders() || []; } catch (e) {}
    }
  },

  _pushOutOfWalls(x, z, radius) {
    var cols = this._colliders;
    if (!cols || cols.length === 0) return { x: x, z: z };
    for (var iter = 0; iter < 5; iter++) {
      var pushed = false;
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        if (c.walkable) continue;
        var cx = Math.max(c.min[0], Math.min(x, c.max[0]));
        var cz = Math.max(c.min[2], Math.min(z, c.max[2]));
        var dx = x - cx;
        var dz = z - cz;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < radius) {
          if (dist < 0.001) {
            x = c.max[0] + radius;
            z = (c.min[2] + c.max[2]) / 2;
          } else {
            var push = radius - dist + 0.01;
            x += (dx / dist) * push;
            z += (dz / dist) * push;
          }
          pushed = true;
        }
      }
      if (!pushed) break;
    }
    return { x: x, z: z };
  },

  update(dt) {
    if (!game.currentMap || !game.currentMap.dropbox) return;
    if (!game.started && !this._dropbox) return;
    if (this._interactCooldown > 0) this._interactCooldown -= dt;

    if (!this._dropbox) {
      this._timer -= dt;
      if (this._timer <= 0) {
        this._spawnDropbox();
      }
    } else {
      this._updateDropbox(dt);
    }

    if (this._interactBtn && this._interactBtn._el) {
      var db = this._dropbox;
      var show = db && db.state === 'landed' && this.game && this.game.player && this.game.player.mesh;
      if (show) {
        var dist = this.game.player.mesh.position.distanceTo(db.mesh.position);
        show = dist <= 4;
      }
      if (show && game.camera) {
        var vec = new THREE.Vector3(db.mesh.position.x, db.mesh.position.y + 0.8, db.mesh.position.z);
        vec.project(game.camera);
        if (vec.z < 1) {
          var px = (vec.x * 0.5 + 0.5) * 100;
          var py = (-vec.y * 0.5 + 0.5) * 100;
          this._interactBtn.x = Math.max(5, Math.min(95, px));
          this._interactBtn.y = Math.max(5, Math.min(95, py));
          this._interactBtn.hidden = false;
        } else {
          this._interactBtn.hidden = true;
        }
      } else if (this._interactBtn) {
        this._interactBtn.hidden = true;
      }
      if (this._interactBtn && this._interactBtn._el) {
        var touch = plugin.get('system_touch_buttons');
        if (touch && touch.enabled) {
          touch._updateElement(this._interactBtn);
        }
        this._interactBtn._el.style.display = this._interactBtn.hidden ? 'none' : 'flex';
        var icon = this._interactBtn._el.querySelector('svg');
        if (icon) {
          icon.style.transform = db && db.state === 'landed' && dist && dist <= 2.5 ? 'scale(1.1)' : 'scale(1)';
        }
      }
    }
  },

  _buildModel() {
    var mp = plugin.get('model_dropbox');
    if (mp && mp.enabled && typeof mp.createModel === 'function') {
      try {
        var m = mp.createModel();
        if (m) return m;
      } catch (e) {}
    }
    var g = new THREE.Group();
    var s = 0.8;
    var box = new THREE.Mesh(
      new THREE.BoxGeometry(s * 0.8, s * 0.6, s * 0.8),
      new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.9 })
    );
    box.castShadow = true;
    box.userData.walkable = false;
    g.add(box);
    var bandMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });
    for (var x = -1; x <= 1; x += 2) {
      for (var z = -1; z <= 1; z += 2) {
        var c = new THREE.Mesh(new THREE.BoxGeometry(0.04, s * 0.62, 0.04), bandMat);
        c.position.set(x * s * 0.38, 0, z * s * 0.38);
        g.add(c);
      }
    }
    var chuteGroup = new THREE.Group();
    chuteGroup.name = 'parachute';
    var fabricMat = new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.95, side: THREE.DoubleSide });
    var domeGeo = new THREE.SphereGeometry(s * 0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    var dome = new THREE.Mesh(domeGeo, fabricMat);
    dome.position.set(0, s * 1.0, 0);
    dome.scale.set(1, 0.5, 1);
    chuteGroup.add(dome);
    var ropeMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.9 });
    var pts = [[s*-0.32,0,s*-0.32],[s*0.32,0,s*-0.32],[s*-0.32,0,s*0.32],[s*0.32,0,s*0.32]];
    pts.forEach(function(pt) {
      var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, s*0.75, 4), ropeMat);
      rod.position.set(pt[0], s*0.375, pt[2]);
      rod.name = 'rope';
      chuteGroup.add(rod);
    });
    g.add(chuteGroup);
    return g;
  },

  _spawnDropbox() {
    var config = game.currentMap.dropbox;
    if (!config) return;

    var model = this._buildModel();
    if (!model) { this._timer = 5; return; }

    var zone = config.zones[Math.floor(Math.random() * config.zones.length)];
    var angle = Math.random() * Math.PI * 2;
    var r = Math.random() * (zone.radius || 4);
    var x = (zone.center[0] || 0) + Math.cos(angle) * r;
    var z = (zone.center[2] || 0) + Math.sin(angle) * r;

    var pushed = this._pushOutOfWalls(x, z, 0.6);
    x = pushed.x; z = pushed.z;

    model.position.set(x, config.minHeight || 14, z);
    model.rotation.y = Math.random() * Math.PI * 2;

    var mp = plugin.get('model_dropbox');
    var anim = plugin.get('core_animation');
    var animId = null;
    if (anim && mp && mp.enabled && mp.animations && mp.animations.floating) {
      animId = anim.play(model, mp.animations.floating);
    }

    var beacon = new THREE.PointLight(0xff4444, 1.5, 10);
    beacon.position.set(0, 0.4, 0);
    model.add(beacon);

    game.scene.add(model);

    this._dropbox = {
      mesh: model,
      y: config.minHeight || 14,
      targetY: 0.25,
      speed: config.fallSpeed || 2.5,
      state: 'falling',
      animId: animId,
      beacon: beacon
    };

    this._timer = (config.dropInterval || 45) + Math.random() * 10;
    if (game.sound) game.sound.play('dropbox_falling');
  },

  _updateDropbox(dt) {
    var db = this._dropbox;
    if (!db || db.state === 'landed' || db.state === 'collected') return;

    db.y -= db.speed * dt;
    if (db.y <= db.targetY) {
      db.y = db.targetY;
      db.state = 'landed';
      db.mesh.position.y = db.y;

      if (game.sound) {
        game.sound.play('dropbox_fell');
        game.sound.stop('dropbox_falling');
      }

      var chute = db.mesh.getObjectByName('parachute');
      if (chute) chute.visible = false;

      var anim = plugin.get('core_animation');
      if (anim && db.animId) {
        anim.stop(db.animId);
        db.animId = null;
      }
      var mp = plugin.get('model_dropbox');
      if (anim && mp && mp.enabled && mp.animations && mp.animations.idle) {
        anim.play(db.mesh, mp.animations.idle);
      }

      // Register dynamic collider for crate
      var dynamicCols = ColliderHelper.extractColliders(db.mesh);
      if (dynamicCols && dynamicCols.length > 0) {
        if (!game._dynamicColliders) game._dynamicColliders = [];
        for (var ci = 0; ci < dynamicCols.length; ci++) {
          game._dynamicColliders.push(dynamicCols[ci]);
        }
        db.colliderRef = dynamicCols;
      }
    }

    var pos = this._pushOutOfWalls(db.mesh.position.x, db.mesh.position.z, 0.6);
    db.mesh.position.x = pos.x;
    db.mesh.position.z = pos.z;
    db.mesh.position.y = db.y;
  },

  _tryInteract() {
    if (this._revealing) return;
    if (!this._dropbox || this._dropbox.state !== 'landed') return;
    var player = this.game.player;
    if (!player || !player.mesh) return;
    var dist = player.mesh.position.distanceTo(this._dropbox.mesh.position);
    if (dist > 3) return;
    this._giveLoot();
  },

  _giveLoot() {
    var db = this._dropbox;
    if (!db) return;

    var pool = plugin.getByType('weapon');
    if (pool.length === 0) return;

    var wp = pool[Math.floor(Math.random() * pool.length)];
    this._pendingLoot = wp;
    this._revealing = true;
    game.paused = true;

    if (game.sound) game.sound.playAt('case_open', db.mesh.position);
    this._animateDropboxOpen();
    this._showCaseReveal(wp);
  },

  _animateDropboxOpen() {
    var db = this._dropbox;
    if (!db) return;
    var start = performance.now();
    var dur = 500;
    var self = this;

    function tick(time) {
      var t = Math.min((time - start) / dur, 1);
      var e = 1 - Math.pow(1 - t, 3);
      db.mesh.scale.setScalar(1 + e * 0.25);
      db.mesh.position.y = db.targetY + e * 0.6;
      if (db.beacon) db.beacon.intensity = 1.5 + e * 4;
      if (t < 1) { requestAnimationFrame(tick); }
      else {
        setTimeout(function() {
          self._removeDropbox();
        }, 300);
      }
    }
    requestAnimationFrame(tick);
  },

  _showCaseReveal(wp) {
    var self = this;
    var pool = plugin.getByType('weapon');
    if (pool.length === 0) return;

    var rarityColors = ['#4fc3f7', '#ab47bc', '#ec407a', '#ef5350', '#ffa726'];
    var rarityLabels = ['KOMÜR', 'ENDER', 'NADIR', 'EPIK', 'EFSANE'];
    var idSum = 0;
    for (var i = 0; i < wp.id.length; i++) idSum += wp.id.charCodeAt(i);
    var rIdx = idSum % rarityColors.length;

    var thumbHelper = null;
    try { thumbHelper = plugin.get('fx_thumbnail_helper'); } catch (e) { thumbHelper = null; }
    var data = [];
    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      var url = thumbHelper && typeof thumbHelper.getThumbnail === 'function' ? thumbHelper.getThumbnail(p.modelId, 110) : '';
      data.push({ name: p.name || p.id, url: url, plugin: p });
    }
    if (data.length === 0) return;

    var winData = null;
    for (var i = 0; i < data.length; i++) {
      if (data[i].plugin.id === wp.id) { winData = data[i]; break; }
    }
    if (!winData) winData = data[0];

    var o = document.createElement('div');
    o.id = 'caseReveal';
    o.innerHTML =
      '<div class="case-bg"></div>' +
      '<div class="case-stage">' +
        '<div class="case-wheel">' +
          '<div class="case-vignette"></div>' +
          '<div class="case-indicator"></div>' +
          '<div class="case-track" id="caseTrack">' +
            '<div class="case-col"><div class="cc-card"><img class="cc-img"><span class="cc-name"></span></div></div>' +
            '<div class="case-col"><div class="cc-card"><img class="cc-img"><span class="cc-name"></span></div></div>' +
            '<div class="case-col"><div class="cc-card"><img class="cc-img"><span class="cc-name"></span></div></div>' +
            '<div class="case-col"><div class="cc-card"><img class="cc-img"><span class="cc-name"></span></div></div>' +
          '</div>' +
          '<div class="case-result" id="caseResult">' +
            '<div class="result-glow" style="background:' + rarityColors[rIdx] + '"></div>' +
            '<div class="result-card">' +
              (winData.url ? '<img class="result-img" src="' + winData.url + '">' : '') +
              '<div class="result-rarity" style="color:' + rarityColors[rIdx] + '">' + rarityLabels[rIdx] + '</div>' +
              '<div class="result-name">' + winData.name + '</div>' +
              '<div class="result-desc">' + (wp.description || wp.weaponType || '') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    void o.offsetWidth;
    o.classList.add('visible');

    var total = data.length;
    var baseIdx = 0;
    var track = document.getElementById('caseTrack');

    function fillCol(col, wd) {
      col.querySelector('.cc-img').src = wd.url || '';
      col.querySelector('.cc-name').textContent = wd.name;
    }

    var pendingSlide = false;

    function prepareNextCol() {
      var nextIdx = (baseIdx + 3) % total;
      var newCol = document.createElement('div');
      newCol.className = 'case-col';
      newCol.innerHTML = '<div class="cc-card"><img class="cc-img"><span class="cc-name"></span></div>';
      fillCol(newCol, data[nextIdx]);
      return newCol;
    }

    var tickTimer;
    var spinStartTime = 0;
    var spinDuration = 4000;

    function getInterval(elapsed) {
      var p = Math.min(Math.max(elapsed / spinDuration, 0), 1);
      var eased = p * p * p;
      return 30 + 470 * eased;
    }

    function estimateTotalSlides() {
      var t = 0;
      var n = 0;
      for (var i = 0; i < 300; i++) {
        var inter = getInterval(t);
        t += inter;
        n++;
        if (t > spinDuration || inter > 500) break;
      }
      return n;
    }

    var targetIdx = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i].plugin.id === wp.id) { targetIdx = i; break; }
    }
    var totalSlides = estimateTotalSlides();
    var initialBaseIdx = ((targetIdx - totalSlides - 1) % total + total) % total;
    baseIdx = initialBaseIdx;
    for (var i = 0; i < 4; i++) fillCol(track.children[i], data[(baseIdx + i) % total]);

    function doSlide() {
      if (pendingSlide) return;
      pendingSlide = true;
      baseIdx = (baseIdx + 1) % total;
      var newCol = prepareNextCol();
      var elapsed = performance.now() - spinStartTime;
      var inter = getInterval(elapsed);
      var dur = Math.min(inter * 0.8, 300);
      var startTime = performance.now();

      function frame(time) {
        var t = Math.min((time - startTime) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        track.style.transform = 'translateX(' + (-160 * eased) + 'px)';
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          track.style.transform = 'translateX(0)';
          track.removeChild(track.firstElementChild);
          track.appendChild(newCol);
          pendingSlide = false;
        }
      }
      requestAnimationFrame(frame);
    }

    function cycle() {
      if (pendingSlide) {
        tickTimer = setTimeout(cycle, 8);
        return;
      }
      if (!spinStartTime) spinStartTime = performance.now();
      var elapsed = performance.now() - spinStartTime;
      var inter = getInterval(elapsed);
      if (inter > 500 || elapsed > spinDuration) {
        baseIdx = (targetIdx - 1 + total) % total;
        track.style.transform = 'translateX(0)';
        for (var i = 0; i < 4; i++) fillCol(track.children[i], data[(baseIdx + i) % total]);
        track.children[1].classList.add('active');
        setTimeout(function() {
          var resultEl = document.getElementById('caseResult');
          if (resultEl) {
            resultEl.classList.add('show');
            if (game.sound) game.sound.play('case_reveal');
          }
          setTimeout(function() {
            self._givePendingLoot();
            self._removeCaseReveal();
          }, 2500);
        }, 400);
        return;
      }
      if (game.sound) game.sound.play('case_spin_tick');
      doSlide();
      tickTimer = setTimeout(cycle, inter);
    }

    tickTimer = setTimeout(cycle, 50);

    this._caseCleanup = function() {
      if (tickTimer) clearTimeout(tickTimer);
    };
  },

  _givePendingLoot() {
    var wp = this._pendingLoot;
    if (!wp) return;
    this._pendingLoot = null;
    this._revealing = false;

    var hotbar = this.game.hotbar;
    var hasWeapon = false;
    var slotIdx = -1;
    for (var i = 0; i < 5; i++) {
      var slot = hotbar.getSlot(i);
      if (slot && slot.id === wp.id) { hasWeapon = true; slotIdx = i; break; }
    }

    var registry = plugin.get('system_weapon_instance');

    if (hasWeapon) {
      hotbar.clearSlot(slotIdx);
      var instanceId = null;
      if (registry && registry.enabled) {
        instanceId = registry.create(wp.id, (wp.clip || 0), (wp.maxAmmo || 0), (wp.reserve || 0));
      }
      hotbar.setSlot(slotIdx, wp.id, instanceId);
      var slot = hotbar.getSlot(slotIdx);
      wp.ammo = slot.ammo;
      wp.reserve = slot.reserve;
      hotbar.selectSlot(slotIdx);
      plugin.emit('ammo:change', { ammo: slot.ammo, maxAmmo: wp.maxAmmo, clip: wp.clip, reserve: slot.reserve });
    } else {
      var emptyIdx = -1;
      for (var i = 0; i < 5; i++) {
        var s = hotbar.getSlot(i);
        if (!s || !s.id) { emptyIdx = i; break; }
      }
      if (emptyIdx >= 0) {
        var instanceId = null;
        if (registry && registry.enabled) {
          instanceId = registry.create(wp.id, (wp.clip || 0), (wp.maxAmmo || 0), (wp.reserve || 0));
        }
        hotbar.setSlot(emptyIdx, wp.id, instanceId);
        var slot = hotbar.getSlot(emptyIdx);
        if (slot) {
          var wasSelected = hotbar.getSelected();
          hotbar.selectSlot(emptyIdx);
          if (wp) { wp.ammo = slot.ammo; wp.reserve = slot.reserve; }
          if (wasSelected && wasSelected.index === emptyIdx) {
            plugin.emit('hotbar:select', { index: emptyIdx, slot: { id: wp.id, ammo: slot.ammo, reserve: slot.reserve } });
          }
        }
      }
      plugin.emit('ammo:change', { ammo: slot ? slot.ammo : (wp.ammo || 0), maxAmmo: wp.maxAmmo, clip: wp.clip, reserve: slot ? slot.reserve : (wp.reserve || 0) });
    }
  },

  _removeCaseReveal() {
    if (typeof this._caseCleanup === 'function') {
      try { this._caseCleanup(); } catch (e) {}
      this._caseCleanup = null;
    }
    var el = document.getElementById('caseReveal');
    if (el) el.remove();
    this._revealing = false;
    game.paused = false;
  },

  _removeDropbox() {
    var db = this._dropbox;
    if (!db) return;

    if (game.sound) game.sound.stop('dropbox_falling');

    // Unregister dynamic colliders
    if (db.colliderRef && game._dynamicColliders) {
      for (var ci = 0; ci < db.colliderRef.length; ci++) {
        var idx = game._dynamicColliders.indexOf(db.colliderRef[ci]);
        if (idx !== -1) game._dynamicColliders.splice(idx, 1);
      }
    }

    var anim = plugin.get('core_animation');
    if (anim && db.animId) {
      anim.stop(db.animId);
      db.animId = null;
    }

    if (db.beacon) {
      db.mesh.remove(db.beacon);
    }

    game.scene.remove(db.mesh);
    db.mesh.traverse(function(child) {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(function(m) { m.dispose(); });
          else child.material.dispose();
        }
      }
    });

    this._dropbox = null;
  },

  _reset() {
    if (this._dropbox) this._removeDropbox();
    if (this._revealing) this._removeCaseReveal();
    if (!game.currentMap || !game.currentMap.dropbox) this._timer = 45 + Math.random() * 10;
    else this._timer = 5 + Math.random() * 3;
  },

  destroy() {
    if (this._dropbox) this._removeDropbox();
    if (this._revealing) this._removeCaseReveal();
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    plugin.off('game:loaded', this.id + '_snd');
    var touch = plugin.get('system_touch_buttons');
    if (touch && touch.enabled) touch.touchRemove('interact');
    plugin.off('map:entered', this.id);
    plugin.off('game:over', this.id);
  }
});
