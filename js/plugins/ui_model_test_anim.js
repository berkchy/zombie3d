PluginRegistry.register({
  id: 'ui_model_test_anim',
  name: 'Animasyon Testi',
  type: 'ui',
  version: '1.0',
  description: 'Model test odasinda animasyon onizleme',
  enabled: true,

  styles:
    '#modelTestExtra .mt-anim-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;padding:10px 12px 6px;border-bottom:1px solid rgba(255,255,255,0.04);margin-bottom:4px;display:none;}' +
    '#modelTestExtra .mt-anim-label.show{display:block;}' +
    '#modelTestExtra .mt-anim-list{display:none;padding:4px 12px 12px;flex-wrap:wrap;gap:4px;}' +
    '#modelTestExtra .mt-anim-list.show{display:flex;}' +
    '#modelTestExtra .mt-anim-btn{padding:4px 12px;font-size:10px;font-weight:500;letter-spacing:0.5px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:rgba(255,255,255,0.5);cursor:pointer;transition:all .15s ease;text-transform:capitalize;}' +
    '#modelTestExtra .mt-anim-btn:hover{background:rgba(79,195,247,0.1);border-color:rgba(79,195,247,0.3);color:#4fc3f7;}' +
    '#modelTestExtra .mt-anim-btn.active{background:rgba(79,195,247,0.15);border-color:#4fc3f7;color:#4fc3f7;}',

  _currentModelId: null,
  _testAnimId: null,

  init() {
    var self = this;

    PluginRegistry.on('model_test:open', this.id, function() {
      self._buildUI();
    });

    PluginRegistry.on('model_test:select', this.id, function(data) {
      self._currentModelId = data.modelId;
      self._stopAnim();
      self._updateButtons(data.modelDef);
    });

    PluginRegistry.on('model_test:close', this.id, function() {
      self._stopAnim();
      self._currentModelId = null;
      self._clearUI();
    });
  },

  _buildUI() {
    var extra = document.getElementById('modelTestExtra');
    if (!extra) return;
    extra.innerHTML =
      '<div class="mt-anim-label" id="mtAnimLabel">Animasyonlar</div>' +
      '<div class="mt-anim-list" id="mtAnimList"></div>';
  },

  _clearUI() {
    var extra = document.getElementById('modelTestExtra');
    if (extra) extra.innerHTML = '';
  },

  _updateButtons(modelDef) {
    var label = document.getElementById('mtAnimLabel');
    var list = document.getElementById('mtAnimList');
    if (!label || !list) return;

    list.innerHTML = '';
    var anims = modelDef && modelDef.animations;
    if (!anims) {
      label.classList.remove('show');
      list.classList.remove('show');
      return;
    }

    label.classList.add('show');
    list.classList.add('show');
    var self = this;

    Object.keys(anims).forEach(function(name) {
      var btn = document.createElement('button');
      btn.className = 'mt-anim-btn';
      var dur = anims[name].duration;
      btn.textContent = name + ' ' + dur.toFixed(1) + 'sn';
      btn.addEventListener('click', function() {
        self._playAnim(name);
        var all = list.querySelectorAll('.mt-anim-btn');
        for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
        btn.classList.add('active');
      });
      list.appendChild(btn);
    });
  },

  _playAnim(name) {
    var animPlugin = PluginRegistry.get('core_animation');
    if (!animPlugin || !animPlugin.enabled) return;
    var modelDef = PluginRegistry.get(this._currentModelId);
    if (!modelDef || !modelDef.animations || !modelDef.animations[name]) return;
    this._stopAnim();
    var testRoom = PluginRegistry.get('ui_model_test');
    if (testRoom && testRoom.currentModel) {
      var savedY = testRoom.currentModel.rotation.y;
      animPlugin.resetPose(testRoom.currentModel, modelDef);
      testRoom.currentModel.rotation.y = savedY;
      this._testAnimId = animPlugin.play(testRoom.currentModel, modelDef.animations[name]);
    }
  },

  _stopAnim() {
    if (this._testAnimId) {
      var animPlugin = PluginRegistry.get('core_animation');
      if (animPlugin && animPlugin.enabled) {
        animPlugin.stop(this._testAnimId);
      }
      this._testAnimId = null;
    }
  },

  destroy() {
    PluginRegistry.off('model_test:open', this.id);
    PluginRegistry.off('model_test:select', this.id);
    PluginRegistry.off('model_test:close', this.id);
    this._stopAnim();
    PluginRegistry.removeStyles(this.id);
  }
});
