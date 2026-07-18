var plugin = include('registry');

plugin.register({
  id: 'fx_skybox',
  name: 'Skybox',
  type: 'scene',
  version: '1.0',
  description: 'Gece g\u00f6ky\u00fcz\u00fc kubbesi (gradient skybox)',
  enabled: true,
  priority: 100,

  skyMesh: null,

  init(game) {
    this.game = game;
    var scene = game.scene;

    // Gradyanli bir kubbe olustur
    var geo = new THREE.SphereGeometry(35, 32, 32);
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#0d0d2b');
    grad.addColorStop(0.15, '#2a1040');
    grad.addColorStop(0.3, '#7a2040');
    grad.addColorStop(0.5, '#c84a20');
    grad.addColorStop(0.7, '#e88430');
    grad.addColorStop(0.85, '#f0a050');
    grad.addColorStop(1, '#b06030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 64);

    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false
    });
    var sky = new THREE.Mesh(geo, mat);
    sky.name = 'skybox';
    sky.renderOrder = -1;
    scene.add(sky);
    this.skyMesh = sky;

    // Yildizlar (kucuk noktalar)
    var starCount = 600;
    var starGeo = new THREE.BufferGeometry();
    var starPos = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount * 3; i += 3) {
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = 32 + Math.random() * 2;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = Math.abs(r * Math.cos(phi)); // sadece ust yarim
      starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    var starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    });
    var stars = new THREE.Points(starGeo, starMat);
    stars.name = 'stars';
    scene.add(stars);
  },

  destroy() {
    var scene = this.game.scene;
    if (this.skyMesh) {
      scene.remove(this.skyMesh);
      if (this.skyMesh.material) this.skyMesh.material.dispose();
      if (this.skyMesh.geometry) this.skyMesh.geometry.dispose();
    }
    var stars = scene.getObjectByName('stars');
    if (stars) {
      scene.remove(stars);
      if (stars.material) stars.material.dispose();
      if (stars.geometry) stars.geometry.dispose();
    }
    plugin.removeStyles(this.id);
  }
});
