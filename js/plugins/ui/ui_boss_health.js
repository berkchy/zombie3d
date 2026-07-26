var plugin = include('registry');

plugin.register({
  id: 'ui_boss_health',
  name: 'Boss Can Barı',
  type: 'ui',
  version: '1.0',
  description: 'Boss can barı — thumbnail, animasyonlu bar, karanlık tasarım',

  game: null,
  bossRef: null,
  container: null,
  _thumbUrl: null,
  _visible: false,
  _fadeTimer: 0,

  styles:
    '#bossHealthUI{position:fixed;top:84px;left:50%;transform:translateX(-50%);z-index:40;display:none;flex-direction:column;align-items:center;pointer-events:none;user-select:none;opacity:0;transition:opacity .4s ease;}' +
    '#bossHealthUI.show{opacity:1;}' +
    '#bossHealthUI .bh-wrap{display:flex;align-items:center;gap:10px;background:rgba(8,0,0,0.75);border:1px solid rgba(180,30,30,0.3);border-radius:8px;padding:6px 14px 6px 8px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 0 30px rgba(180,20,20,0.08),inset 0 1px 0 rgba(255,255,255,0.03);}' +
    '#bossHealthUI .bh-thumb{width:42px;height:42px;border-radius:4px;overflow:hidden;background:rgba(0,0,0,0.4);border:1px solid rgba(180,30,30,0.2);flex-shrink:0;}' +
    '#bossHealthUI .bh-thumb img{width:100%;height:100%;display:block;object-fit:contain;}' +
    '#bossHealthUI .bh-thumb .bh-thumb-load{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(180,30,30,0.3);}' +
    '#bossHealthUI .bh-info{flex:1;min-width:160px;}' +
    '#bossHealthUI .bh-info .bh-name{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(200,50,50,0.7);margin-bottom:4px;text-shadow:0 0 12px rgba(200,30,30,0.15);}' +
    '#bossHealthUI .bh-info .bh-name .bh-name-wave{color:rgba(255,255,255,0.15);font-weight:400;margin-left:6px;}' +
    '#bossHealthUI .bh-info .bh-bar-wrap{position:relative;height:6px;background:rgba(60,10,10,0.5);border-radius:3px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.4);}' +
    '#bossHealthUI .bh-info .bh-bar-wrap .bh-bar{height:100%;width:100%;border-radius:3px;background:linear-gradient(90deg,#b71c1c,#e53935,#ff5252);transition:width .15s ease;box-shadow:0 0 12px rgba(200,30,30,0.2);position:relative;}' +
    '#bossHealthUI .bh-info .bh-bar-wrap .bh-bar::after{content:"";position:absolute;top:0;left:0;right:0;height:50%;background:rgba(255,255,255,0.12);border-radius:3px 3px 0 0;}' +
    '#bossHealthUI .bh-info .bh-hp-text{font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:0.5px;margin-top:3px;text-align:right;}' +
    '#bossHealthUI .bh-info .bh-hp-text span{color:rgba(200,50,50,0.5);font-weight:600;}' +
    '#bossHealthUI .bh-glow{position:absolute;top:50%;left:50%;width:120%;height:120%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(180,20,20,0.06) 0%,transparent 70%);pointer-events:none;animation:bhPulse 2s ease-in-out infinite;}' +
    '#bossHealthUI .bh-glow.die{animation:bhFadeOut 0.6s ease forwards;}' +
    '@keyframes bhPulse{0%,100%{opacity:0.6;}50%{opacity:1;}}' +
    '@keyframes bhFadeOut{0%{opacity:1;}100%{opacity:0;}}',

  init(game) {
    this.game = game;
    this.bossRef = null;
    this._thumbUrl = null;
    this._visible = false;

    var self = this;

    var div = document.createElement('div');
    div.id = 'bossHealthUI';
    div.innerHTML =
      '<div class="bh-wrap">' +
        '<div class="bh-thumb" id="bhThumb"><div class="bh-thumb-load">&#9760;</div></div>' +
        '<div class="bh-info">' +
          '<div class="bh-name">BOSS <span class="bh-name-wave" id="bhWave"></span></div>' +
          '<div class="bh-bar-wrap"><div class="bh-bar" id="bhBar"></div></div>' +
          '<div class="bh-hp-text"><span id="bhHp">100</span> / <span id="bhMaxHp">100</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="bh-glow" id="bhGlow"></div>';
    document.body.appendChild(div);
    this.container = div;

    plugin.on('boss:entered', this.id, function(data) {
      if (!data || !data.boss) return;
      self.bossRef = data.boss;
      self._showBossBar(data);
    });

    plugin.on('boss:die', this.id, function() {
      self._hideBossBar();
    });

    plugin.on('game:over', this.id, function() {
      self._hideBossBar();
    });
  },

  _showBossBar(data) {
    this._visible = true;
    this._fadeTimer = 0;

    var waveEl = document.getElementById('bhWave');
    if (waveEl) waveEl.textContent = 'DALGA ' + (data.wave || '?');

    var maxHpEl = document.getElementById('bhMaxHp');
    if (maxHpEl && data.boss) maxHpEl.textContent = Math.ceil(data.boss.maxHp);

    this.container.classList.add('show');
    this.container.style.display = 'flex';

    var glow = document.getElementById('bhGlow');
    if (glow) glow.className = 'bh-glow';

    this._renderThumbnail(function(url) {
      var thumb = document.getElementById('bhThumb');
      if (thumb && url) {
        thumb.innerHTML = '<img src="' + url + '" alt="Boss">';
      }
    });
  },

  _hideBossBar() {
    this.bossRef = null;
    var glow = document.getElementById('bhGlow');
    if (glow) glow.className = 'bh-glow die';
    var self = this;
    setTimeout(function() {
      self._visible = false;
      self.container.classList.remove('show');
      self.container.style.display = 'none';
      if (glow) glow.className = 'bh-glow';
    }, 600);
  },

  update() {
    if (!this._visible || !this.bossRef) return;
    if (!this.bossRef.alive) return;

    var boss = this.bossRef;
    var pct = Math.max(0, boss.hp / boss.maxHp);

    var bar = document.getElementById('bhBar');
    if (bar) bar.style.width = (pct * 100) + '%';

    var hpEl = document.getElementById('bhHp');
    if (hpEl) hpEl.textContent = Math.ceil(Math.max(0, boss.hp));
  },

  _renderThumbnail(callback) {
    if (this._thumbUrl) {
      callback(this._thumbUrl);
      return;
    }

    var modelP = plugin.get('model_boss');
    if (!modelP || !modelP.enabled || typeof modelP.createModel !== 'function') {
      callback(null);
      return;
    }

    var mesh;
    try { mesh = modelP.createModel(); } catch (e) { callback(null); return; }
    if (!mesh) { callback(null); return; }

    var size = 84;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      renderer.setSize(size, size);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);
    } catch (e) { callback(null); return; }

    var scene = new THREE.Scene();
    scene.background = null;
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(3, 5, 4);
    scene.add(dl);
    var bl = new THREE.DirectionalLight(0x8888ff, 0.3);
    bl.position.set(-2, 3, -3);
    scene.add(bl);

    var box = new THREE.Box3().setFromObject(mesh);
    var s = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(s.x, s.y, s.z);
    if (maxDim > 0) {
      var scale = 1.5 / maxDim;
      mesh.scale.set(scale, scale, scale);
    }
    var center = box.getCenter(new THREE.Vector3());
    mesh.position.sub(center);

    var camera = new THREE.PerspectiveCamera(25, 1, 0.1, 20);
    camera.position.set(1.8, 1.0, 1.8);
    camera.lookAt(0, 0, 0);

    scene.add(mesh);
    renderer.render(scene, camera);
    scene.remove(mesh);

    mesh.traverse(function(child) {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(function(m) { m.dispose(); });
          else child.material.dispose();
        }
      }
    });

    var url = renderer.domElement.toDataURL();
    renderer.dispose();

    this._thumbUrl = url;
    callback(url);
  },

  destroy() {
    if (this.container) this.container.remove();
    plugin.off('boss:entered', this.id);
    plugin.off('boss:die', this.id);
    plugin.off('game:over', this.id);
    plugin.removeStyles(this.id);
  }
});
