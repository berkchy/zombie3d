var plugin = include('registry');

plugin.register({
  id: 'ui_model_test_anim',
  name: 'Animasyon Testi',
  type: 'ui',
  version: '2.0',
  description: 'Model test odasinda animasyon onizleme + hiz kontrolu',
  enabled: true,

  styles:
    '#modelTestExtra .mt-anim-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;padding:10px 12px 6px;border-bottom:1px solid rgba(255,255,255,0.04);margin-bottom:4px;display:none;}' +
    '#modelTestExtra .mt-anim-label.show{display:block;}' +
    '#modelTestExtra .mt-anim-list{display:none;padding:4px 12px 12px;flex-wrap:wrap;gap:4px;}' +
    '#modelTestExtra .mt-anim-list.show{display:flex;}' +
    '#modelTestExtra .mt-anim-btn{padding:4px 12px;font-size:10px;font-weight:500;letter-spacing:0.5px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:rgba(255,255,255,0.5);cursor:pointer;transition:all .15s ease;text-transform:capitalize;}' +
    '#modelTestExtra .mt-anim-btn:hover{background:rgba(79,195,247,0.1);border-color:rgba(79,195,247,0.3);color:#4fc3f7;}' +
    '#modelTestExtra .mt-anim-btn.active{background:rgba(79,195,247,0.15);border-color:#4fc3f7;color:#4fc3f7;}' +
    '#modelTestExtra .mt-speed-row{display:none;padding:6px 12px 12px;align-items:center;gap:10px;}' +
    '#modelTestExtra .mt-speed-row.show{display:flex;}' +
    '#modelTestExtra .mt-speed-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.2);letter-spacing:1.5px;text-transform:uppercase;white-space:nowrap;}' +
    '#modelTestExtra .mt-speed-slider{-webkit-appearance:none;appearance:none;flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.08);outline:none;transition:background .2s;}' +
    '#modelTestExtra .mt-speed-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:#4fc3f7;border:2px solid #0a0a0a;cursor:pointer;transition:transform .15s;}' +
    '#modelTestExtra .mt-speed-slider::-webkit-slider-thumb:hover{transform:scale(1.2);}' +
    '#modelTestExtra .mt-speed-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#4fc3f7;border:2px solid #0a0a0a;cursor:pointer;}' +
    '#modelTestExtra .mt-speed-val{font-size:11px;font-weight:500;color:rgba(255,255,255,0.5);min-width:44px;text-align:right;font-family:monospace;letter-spacing:0.5px;}',

  _currentModelId: null,
  _testAnimId: null,
  _currentAnimName: null,
  _currentAnimDef: null,

  init() {
    var self = this;

    plugin.on('model_test:open', this.id, function() {
      self._buildUI();
    });

    plugin.on('model_test:select', this.id, function(data) {
      self._currentModelId = data.modelId;
      self._stopAnim();
      self._currentAnimName = null;
      self._currentAnimDef = null;
      self._updateButtons(data.modelDef);
    });

    plugin.on('model_test:close', this.id, function() {
      self._stopAnim();
      self._currentModelId = null;
      self._currentAnimName = null;
      self._currentAnimDef = null;
      self._clearUI();
    });
  },

  _buildUI() {
    var extra = document.getElementById('modelTestExtra');
    if (!extra) return;

    var self = this;

    this._sliderValue = 1.0;

    extra.innerHTML =
      '<div class="mt-anim-label" id="mtAnimLabel">Animasyonlar</div>' +
      '<div class="mt-anim-list" id="mtAnimList"></div>' +
      '<div class="mt-speed-row" id="mtSpeedRow">' +
        '<span class="mt-speed-label">Hız</span>' +
        '<input type="range" class="mt-speed-slider" id="mtSpeedSlider" min="0.1" max="3.0" step="0.1" value="1.0">' +
        '<span class="mt-speed-val" id="mtSpeedVal">1.00sn</span>' +
      '</div>';

    var slider = document.getElementById('mtSpeedSlider');
    if (slider) {
      slider.addEventListener('input', function() {
        self._sliderValue = parseFloat(this.value);
        self._updateSpeedDisplay();
        if (self._currentAnimName) self._playAnim(self._currentAnimName);
      });
    }
  },

  _clearUI() {
    var extra = document.getElementById('modelTestExtra');
    if (extra) extra.innerHTML = '';
  },

  _updateSpeedDisplay() {
    var valEl = document.getElementById('mtSpeedVal');
    if (!valEl) return;
    var speed = this._sliderValue || 1;
    var origDur = this._currentAnimDef ? this._currentAnimDef.duration : 0;
    var effective = origDur / speed;
    valEl.textContent = effective.toFixed(2) + 'sn';
  },

  _updateButtons(modelDef) {
    var label = document.getElementById('mtAnimLabel');
    var list = document.getElementById('mtAnimList');
    var speedRow = document.getElementById('mtSpeedRow');
    if (!label || !list || !speedRow) return;

    list.innerHTML = '';
    var anims = modelDef && modelDef.animations;
    if (!anims) {
      label.classList.remove('show');
      list.classList.remove('show');
      speedRow.classList.remove('show');
      return;
    }

    label.classList.add('show');
    list.classList.add('show');
    speedRow.classList.add('show');

    var self = this;
    var sorted = Object.keys(anims).sort();

    sorted.forEach(function(name) {
      var btn = document.createElement('button');
      btn.className = 'mt-anim-btn';
      var dur = anims[name].duration;
      btn.textContent = name + ' ' + dur.toFixed(1) + 'sn';
      btn.addEventListener('click', function() {
        self._currentAnimDef = anims[name];
        self._currentAnimName = name;
        self._updateSpeedDisplay();
        self._playAnim(name);
        var all = list.querySelectorAll('.mt-anim-btn');
        for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
        btn.classList.add('active');
      });
      list.appendChild(btn);
    });

    var first = Object.keys(anims)[0];
    if (first) {
      this._currentAnimDef = anims[first];
      this._currentAnimName = first;
      this._updateSpeedDisplay();
    }
  },

  _playAnim(name) {
    var animPlugin = plugin.get('core_animation');
    if (!animPlugin || !animPlugin.enabled) return;
    var modelDef = plugin.get(this._currentModelId);
    if (!modelDef || !modelDef.animations || !modelDef.animations[name]) return;
    this._stopAnim();
    var testRoom = plugin.get('ui_model_test');
    if (testRoom && testRoom.currentModel) {
      var savedY = testRoom.currentModel.rotation.y;
      animPlugin.resetPose(testRoom.currentModel, modelDef);

      var original = modelDef.animations[name];
      var speed = this._sliderValue || 1;
      var modified = {
        duration: original.duration / speed,
        loop: original.loop,
        tracks: original.tracks,
        onComplete: original.onComplete
      };

      testRoom.currentModel.rotation.y = savedY;
      this._testAnimId = animPlugin.play(testRoom.currentModel, modified);
    }
  },

  _stopAnim() {
    if (this._testAnimId) {
      var animPlugin = plugin.get('core_animation');
      if (animPlugin && animPlugin.enabled) {
        animPlugin.stop(this._testAnimId);
      }
      this._testAnimId = null;
    }
  },

  destroy() {
    plugin.off('model_test:open', this.id);
    plugin.off('model_test:select', this.id);
    plugin.off('model_test:close', this.id);
    this._stopAnim();
    plugin.removeStyles(this.id);
  }
});
