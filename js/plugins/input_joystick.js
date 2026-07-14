PluginRegistry.register({
  id: 'input_joystick',
  name: 'Dokunmatik Joystick',
  type: 'ui',
  version: '1.0',
  description: 'Mobil cihazlar için ekran joysticki',
  priority: 50,
  enabled: true,

  styles:
    '#joystick-area{position:fixed;left:40px;bottom:70px;width:120px;height:120px;z-index:180;border-radius:50%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08);touch-action:none;display:none;user-select:none;-webkit-user-select:none;}' +
    '#joystick-area.active{display:block;}' +
    '#joystick-knob{position:absolute;top:50%;left:50%;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 40% 35%,rgba(255,255,255,0.2),rgba(255,255,255,0.05));border:1.5px solid rgba(255,255,255,0.12);transform:translate(-50%,-50%);box-shadow:0 0 20px rgba(255,255,255,0.04);transition:box-shadow .2s;}' +
    '#joystick-knob::after{content:"";position:absolute;inset:6px;border-radius:50%;background:radial-gradient(circle at 40% 30%,rgba(255,255,255,0.12),transparent 70%);}' +
    '#joystick-area.touching #joystick-knob{border-color:rgba(255,255,255,0.25);box-shadow:0 0 30px rgba(255,255,255,0.06);}',

  game: null,
  area: null,
  knob: null,
  active: false,
  touchId: -1,
  centerX: 0,
  centerY: 0,
  maxDist: 40,

  init(game) {
    this.game = game;
    if (!game.input) game.input = { x: 0, y: 0, shoot: false, _joyx: 0, _joyy: 0 };

    var self = this;

    // Sadece dokunmatik cihazlarda göster
    var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    var area = document.createElement('div');
    area.id = 'joystick-area';
    area.className = 'active';
    var knob = document.createElement('div');
    knob.id = 'joystick-knob';
    area.appendChild(knob);
    document.body.appendChild(area);
    this.area = area;
    this.knob = knob;

    // Oyun baslamadiginda gizle
    area.style.display = 'none';
    PluginRegistry.on('game:start', this.id, function() {
      area.style.display = 'block';
    });
    PluginRegistry.on('game:over', this.id, function() {
      self._reset();
      area.style.display = 'none';
    });

    function getPos(e) {
      var t = e.touches ? e.touches[0] : e;
      return { x: t.clientX, y: t.clientY };
    }

    area.addEventListener('touchstart', function(e) {
      e.preventDefault();
      if (self.active) return;
      self.active = true;
      area.classList.add('touching');
      var t = e.changedTouches[0];
      self.touchId = t.identifier;
      var rect = area.getBoundingClientRect();
      self.centerX = rect.left + rect.width / 2;
      self.centerY = rect.top + rect.height / 2;
      self._updateKnob(t.clientX, t.clientY);
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
      if (!self.active) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === self.touchId) {
          self._updateKnob(t.clientX, t.clientY);
          break;
        }
      }
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
      if (!self.active) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === self.touchId) {
          self._reset();
          break;
        }
      }
    }, { passive: false });

    document.addEventListener('touchcancel', function() {
      self._reset();
    }, { passive: false });
  },

  _updateKnob(tx, ty) {
    var dx = tx - this.centerX;
    var dy = ty - this.centerY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var max = this.maxDist;

    if (dist > max) {
      dx = dx / dist * max;
      dy = dy / dist * max;
      dist = max;
    }

    this.knob.style.transform = 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px)';

    var norm = dist / max;
    var angle = Math.atan2(dy, dx);

    game.input._joyx = Math.cos(angle) * norm;
    game.input._joyy = Math.sin(angle) * norm;
  },

  _reset() {
    this.active = false;
    this.touchId = -1;
    this.area.classList.remove('touching');
    this.knob.style.transform = 'translate(-50%,-50%)';
    game.input._joyx = 0;
    game.input._joyy = 0;
  },

  update() {
    // input_manager zaten game.input'u sıfırlıyor.
    // Joystick dokunulmuyorsa game.input 0 kalır (input_manager sıfırlamış olabilir)
    // Burada ek bir şey yapmamıza gerek yok
  },

  destroy() {
    if (this.area) this.area.remove();
    PluginRegistry.removeStyles(this.id);
  }
});
