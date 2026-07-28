var plugin = include('registry');
plugin.register({
  id: 'map_skybox_day',
  name: 'Gunduz Skybox',
  type: 'map_model',
  version: '1.0',
  description: 'Gunduz skybox — mavi gok, bulutlar',
  createModel: function(config) {
    var group = new THREE.Group();
    var geo = new THREE.SphereGeometry(35, 32, 32);
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#1a1a4a');
    grad.addColorStop(0.1, '#2a3060');
    grad.addColorStop(0.25, '#4a7aaa');
    grad.addColorStop(0.4, '#6a9add');
    grad.addColorStop(0.55, '#8ab8ee');
    grad.addColorStop(0.7, '#a0c8f0');
    grad.addColorStop(0.85, '#c0ddf5');
    grad.addColorStop(1, '#d0c8a0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 64);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
    var sky = new THREE.Mesh(geo, mat);
    sky.name = 'skybox_day';
    sky.renderOrder = -1;
    group.add(sky);

    return { mesh: group, colliders: [] };
  }
});
