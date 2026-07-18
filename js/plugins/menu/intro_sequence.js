var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'intro_sequence',
  name: 'Giriş Animasyonu',
  type: 'scene',
  version: '2.1',
  description: '2D logo giris animasyonu — aydinliktan karanlıga gölge geçişi',
  enabled: true,
  priority: 50,

  styles: '.intro-overlay{position:fixed;inset:0;z-index:215;background:#000;transition:opacity 1s;pointer-events:none;}' +
    '.intro-overlay.hidden{opacity:0;}',

  game: null,
  container: null,
  playing: false,
  elapsed: 0,
  duration: 4,
  logoMesh: null,
  hiddenObjects: [],
  logoLights: [],
  _playerHidden: false,

  init(game) {
    this.game = game;
    loader.loadScript('model_logo', function(){});

    var div = document.createElement('div');
    div.className = 'intro-overlay hidden';
    document.body.appendChild(div);
    this.container = div;

    plugin.on('game:loaded', 'intro_sequence', function() {
      this.play();
    }.bind(this));
  },

  play() {
    if (this.playing) return;
    this.playing = true;
    this.elapsed = 0;

    var scene = this.game.scene;
    scene.background = new THREE.Color(0x000000);

    // Fog'u temizle (kararma animasyonunda halka efekti yapabilir)
    this._savedFog = scene.fog;
    scene.fog = null;

    // Tum sahne objelerini gizle (sadece logo ve isiklar kalacak)
    this.hiddenObjects = [];
    // once mevcut cocuklari topla (canli listede gezinirken sorun olmasin)
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

    // Player modelini gizle (ekstra guvence)
    if (this.game.player && this.game.player.mesh) {
      this.game.player.mesh.visible = false;
      this._playerHidden = true;
    }

    // Logo 3D model
    var logoPlugin = plugin.get('model_logo');
    if (logoPlugin && logoPlugin.enabled && logoPlugin.createModel) {
      this.logoMesh = logoPlugin.createModel();
      this.logoMesh.position.set(0, 0.3, 0);
      scene.add(this.logoMesh);
    }

    // Logo icin isiklandirma
    var amb = new THREE.AmbientLight(0x404060, 0.8);
    scene.add(amb);
    this.logoLights.push(amb);

    var dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(3, 5, 6);
    dir.name = 'logoDirLight';
    scene.add(dir);
    this.logoLights.push(dir);

    // Kamera
    this.game.camera.position.set(0, 0.3, 8);
    this.game.camera.lookAt(0, 0.3, 0);
  },

  update(dt) {
    if (!this.playing) return;
    this.elapsed += dt;
    var p = Math.min(this.elapsed / this.duration, 1);

    // Isik animasyonu: aydinliktan karanliga
    var easeFade = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

    if (this.logoLights[0]) {
      this.logoLights[0].intensity = 0.8 * (1 - easeFade) + 0.02 * easeFade;
    }
    if (this.logoLights[1]) {
      this.logoLights[1].intensity = 1.5 * (1 - easeFade);
      this.logoLights[1].position.x = 3 + (0.5 - 3) * easeFade;
      this.logoLights[1].position.y = 5 + (1 - 5) * easeFade;
    }

    if (p >= 1) {
      this.playing = false;
      this.cleanup();
      plugin.emit('intro:done');
    }
  },

  cleanup() {
    var scene = this.game.scene;

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

    // Logo isiklarini kaldir
    for (var li = 0; li < this.logoLights.length; li++) {
      scene.remove(this.logoLights[li]);
    }
    this.logoLights = [];

    // Gizlenen tum objeleri geri goster
    for (var hi = 0; hi < this.hiddenObjects.length; hi++) {
      this.hiddenObjects[hi].visible = true;
    }
    this.hiddenObjects = [];

    // Player'i geri goster
    if (this._playerHidden && this.game.player && this.game.player.mesh) {
      this.game.player.mesh.visible = true;
      this._playerHidden = false;
    }

    scene.background = new THREE.Color(0x1a0f0a);

    // Fog'u geri yukle
    if (this._savedFog) {
      scene.fog = this._savedFog;
      this._savedFog = null;
    }

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
