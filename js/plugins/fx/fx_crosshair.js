var plugin = window.include('registry');
var cvar = window.include('cvar');

plugin.register({
  id: 'fx_crosshair',
  name: 'Nisan' + 'gah',
  type: 'graphics',
  version: '1.0',
  description: 'Cvar ile ozellestirilebilir nisangah',
  enabled: true,
  priority: 90,

  _size: 20,
  _thickness: 2,
  _gap: 3,
  _color: '#ffffff',
  _outline: true,
  _shape: 'cross',
  _dot: false,
  _alpha: 0.8,

  init(game) {
    if (!cvar) return;

    cvar.register('crosshair_enabled',    true,    'boolean', 'Nisangah acik/kapali');
    cvar.register('crosshair_size',       1.0,     'number',  'Nisangah boyutu (0.5 - 3.0)');
    cvar.register('crosshair_color',      '#ffffff','string',  'Nisangah rengi (hex)');
    cvar.register('crosshair_thickness',  2,       'number',  'Cizgi kalinligi (1 - 5)');
    cvar.register('crosshair_gap',        3,       'number',  'Merkez boslugu (0 - 15)');
    cvar.register('crosshair_outline',    true,    'boolean', 'Siyah cerceve');
    cvar.register('crosshair_alpha',       0.8,     'number',  'Saydamlik (0.0 - 1.0)');
    cvar.register('crosshair_shape',      'cross', 'string',  'Sekil: cross, dot, circle, angle');
    cvar.register('crosshair_dot',        false,   'boolean', 'Merkez nokta');

    var self = this;
    function readCvars() {
      self._size    = 20 * (+cvar.get('crosshair_size') || 1);
      self._thickness = +cvar.get('crosshair_thickness') || 2;
      self._gap     = +cvar.get('crosshair_gap') || 3;
      self._color   = cvar.get('crosshair_color') || '#ffffff';
      self._outline  = cvar.get('crosshair_outline') !== false;
      self._shape   = cvar.get('crosshair_shape') || 'cross';
      self._dot     = !!cvar.get('crosshair_dot');
      self._alpha   = +cvar.get('crosshair_alpha') || 0.8;
    }
    readCvars();

    var ids = ['crosshair_size','crosshair_thickness','crosshair_gap','crosshair_color','crosshair_outline','crosshair_shape','crosshair_dot','crosshair_alpha'];
    ids.forEach(function(id) {
      cvar.onChange(id, readCvars);
    });
  },

  render2d(ctx, w, h) {
    if (!cvar || !cvar.get('crosshair_enabled')) return;
    if (!gameStarted) return;

    var cx = w / 2;
    var cy = h / 2;
    var size = this._size;
    var thick = this._thickness;
    var gap = this._gap;
    var alpha = this._alpha;
    var half = thick / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';

    var outline = this._outline;

    function drawLine(x1, y1, x2, y2) {
      if (outline) {
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = thick + 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.strokeStyle = self._color;
      ctx.lineWidth = thick;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    var self = this;
    var shape = this._shape;

    if (shape === 'dot') {
      var r = Math.max(thick, 3);
      if (outline) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = self._color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

    } else if (shape === 'circle') {
      var r = size;
      if (outline) {
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = thick + 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = self._color;
      ctx.lineWidth = thick;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

    } else if (shape === 'angle') {
      var len = size;
      var g = gap;
      //   \ /
      //    .
      // Upper-left
      drawLine(cx - g, cy - g - len * 0.3, cx - g - len, cy - g - len);
      // Upper-right
      drawLine(cx + g, cy - g - len * 0.3, cx + g + len, cy - g - len);
      // Lower-left
      drawLine(cx - g, cy + g + len * 0.3, cx - g - len, cy + g + len);
      // Lower-right
      drawLine(cx + g, cy + g + len * 0.3, cx + g + len, cy + g + len);

    } else {
      // cross (default)
      var len = size;
      var g = gap;

      drawLine(cx, cy - g - len, cx, cy - g);
      drawLine(cx, cy + g, cx, cy + g + len);
      drawLine(cx - g - len, cy, cx - g, cy);
      drawLine(cx + g, cy, cx + g + len, cy);
    }

    if (this._dot) {
      var dr = Math.max(thick * 0.5, 1.5);
      if (outline) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, dr + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = self._color;
      ctx.beginPath();
      ctx.arc(cx, cy, dr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
});
