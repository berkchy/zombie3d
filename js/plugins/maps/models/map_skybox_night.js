var plugin = include('registry');
plugin.register({
  id: 'map_skybox_night',
  name: 'Gece Skybox',
  type: 'map_model',
  version: '1.0',
  description: 'Gece skybox — yildizlar, koyu gokyuzu',
  createModel: function(config) {
    var group = new THREE.Group();
    var geo = new THREE.SphereGeometry(35, 32, 32);
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#050510');
    grad.addColorStop(0.2, '#0a0a20');
    grad.addColorStop(0.4, '#10103a');
    grad.addColorStop(0.6, '#15154a');
    grad.addColorStop(0.8, '#1a1a4a');
    grad.addColorStop(1, '#0d0d20');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 64);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
    var sky = new THREE.Mesh(geo, mat);
    sky.name = 'skybox_night';
    sky.renderOrder = -1;
    group.add(sky);

    var starCount = 800;
    var starGeo = new THREE.BufferGeometry();
    var starPos = new Float32Array(starCount * 3);
    var starSizes = new Float32Array(starCount);
    for (var i = 0; i < starCount; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = 32 + Math.random() * 2;
      starPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = Math.abs(r * Math.cos(phi));
      starPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      starSizes[i] = 0.05 + Math.random() * 0.15;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.6, depthWrite: false });
    var stars = new THREE.Points(starGeo, starMat);
    stars.name = 'stars_night';
    group.add(stars);

    return { mesh: group, colliders: [] };
  }
});
