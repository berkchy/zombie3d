var plugin = window.include('registry');

plugin.register({
  id: 'fx_viewmodel_sway',
  name: 'ViewModel Sway',
  type: 'fx',
  version: '1.5',
  description: 'Kamera hareketine gore viewmodel sallanmasi',

  _prevYaw: 0,
  _prevPitch: 0,
  _swayX: 0,
  _swayY: 0,
  _smoothDeltaX: 0,
  _smoothDeltaY: 0,
  _basePos: null,

  swayScale: 2,
  swayMax: 0.08,
  inputSmoothness: 7,
  smoothReturn: 30,

  init() {
    this._swayX = 0;
    this._swayY = 0;
    this._smoothDeltaX = 0;
    this._smoothDeltaY = 0;
    this._prevYaw = (game && game.fpYaw) || 0;
    this._prevPitch = (game && game.fpPitch) || 0;
    this._basePos = null;

    var cvar = plugin.get('system_cvar');
    if (cvar && cvar.enabled) {
      cvar.register('viewmodel_sway_scale', 2, 'number', 'ViewModel sallanma hassasiyeti (0.5 - 10)');
    }
  },

  setBasePosition: function(x, y) {
    this._basePos = { x: x, y: y };
  },

  update(dt) {
    if (!game || game._consoleOpen || !game.started) return;

    var fp = plugin.get('fx_firstperson');
    if (!fp || !fp.enabled || !fp._viewGroup) return;

    var vm = fp._viewGroup;

    if (!this._basePos) {
      this._basePos = { x: vm.position.x, y: vm.position.y };
    }

    var cvar = plugin.get('system_cvar');
    var scale = this.swayScale;
    if (cvar && cvar.enabled) {
      var cv = cvar.get('viewmodel_sway_scale');
      if (cv) scale = parseFloat(cv.value) || this.swayScale;
    }

    var yaw = game.fpYaw || 0;
    var pitch = game.fpPitch || 0;

    var yawDelta = yaw - this._prevYaw;
    var pitchDelta = pitch - this._prevPitch;

    this._prevYaw = yaw;
    this._prevPitch = pitch;

    var smoothFactor = 1 - Math.exp(-this.inputSmoothness * dt);
    this._smoothDeltaX += (yawDelta - this._smoothDeltaX) * smoothFactor;
    this._smoothDeltaY += (pitchDelta - this._smoothDeltaY) * smoothFactor;

    var targetX = this._smoothDeltaX * scale;
    var targetY = this._smoothDeltaY * scale;

    if (targetX > this.swayMax) targetX = this.swayMax;
    else if (targetX < -this.swayMax) targetX = -this.swayMax;
    if (targetY > this.swayMax) targetY = this.swayMax;
    else if (targetY < -this.swayMax) targetY = -this.swayMax;

    var lerpFactor = 1 - Math.exp(-this.smoothReturn * dt);
    this._swayX += (targetX - this._swayX) * lerpFactor;
    this._swayY += (targetY - this._swayY) * lerpFactor;

    vm.position.x = this._basePos.x + this._swayX;
    vm.position.y = this._basePos.y + this._swayY;
  },

  destroy() {
    this._swayX = 0;
    this._swayY = 0;
    this._smoothDeltaX = 0;
    this._smoothDeltaY = 0;
    this._prevYaw = 0;
    this._prevPitch = 0;
    this._basePos = null;

    var fp = plugin.get('fx_firstperson');
    if (fp && fp._viewGroup) {
      fp._viewGroup.position.set(0.15, -0.12, -0.28);
    }
  }
});
