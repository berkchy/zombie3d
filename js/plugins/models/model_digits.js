var plugin = include('registry');

var _segments = [
  { x: 0,      y: 0.085, w: 0.14, h: 0.035 },
  { x: -0.070, y: 0.042, w: 0.035, h: 0.085 },
  { x: 0.070,  y: 0.042, w: 0.035, h: 0.085 },
  { x: 0,      y: 0,     w: 0.14, h: 0.035 },
  { x: -0.070, y: -0.042, w: 0.035, h: 0.085 },
  { x: 0.070,  y: -0.042, w: 0.035, h: 0.085 },
  { x: 0,      y: -0.085, w: 0.14, h: 0.035 }
];

var _defs = {
  '0': [1,1,1,0,1,1,1],
  '1': [0,0,1,0,0,1,0],
  '2': [1,0,1,1,1,0,1],
  '3': [1,0,1,1,0,1,1],
  '4': [0,1,1,1,0,1,0],
  '5': [1,1,0,1,0,1,1],
  '6': [1,1,0,1,1,1,1],
  '7': [1,0,1,0,0,1,0],
  '8': [1,1,1,1,1,1,1],
  '9': [1,1,1,1,0,1,1]
};

function _getMat(color) {
  return new THREE.MeshBasicMaterial({ color: color });
}

plugin.register({
  id: 'model_digits',
  name: 'Rakam Model',
  type: 'core',
  version: '3.0',
  description: 'Hasar numaralari icin 3 boyutlu segment rakam modeli',
  enabled: true,

  init() {},

  createNumber(value, color) {
    var str = String(Math.abs(Math.round(value)));
    var group = new THREE.Group();
    var totalW = str.length * 0.26;
    var startX = -totalW / 2;

    for (var i = 0; i < str.length; i++) {
      var def = _defs[str[i]];
      if (!def) continue;

      var dg = new THREE.Group();
      var mat = _getMat(color || 0xffcc44);

      for (var s = 0; s < _segments.length; s++) {
        if (!def[s]) continue;
        var seg = _segments[s];
        var geo = new THREE.BoxGeometry(seg.w, seg.h, 0.18);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(seg.x, seg.y, 0);
        dg.add(mesh);
      }

      dg.position.set(startX + i * 0.26, 0, 0);
      group.add(dg);
    }

    return group;
  },

  destroy() {
  }
});
