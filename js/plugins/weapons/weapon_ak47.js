var plugin = window.include('registry');

plugin.register({
  id: 'weapon_ak47',
  name: 'AK-47',
  version: '1.2',
  type: 'weapon',
  weaponType: 'rifle',
  modelId: 'model_ak47',
  description: 'AK-47 from Half-Life .mdl (native animations)',

  cooldown: 0,
  cooldownTime: 0.12,
  damage: 30,
  spreadAngle: 0.025,
  knockback: 35,
  knockbackDistance: 6,
  shake: 0.05,
  clip: 30,
  ammo: 30,
  maxAmmo: 90,
  reserve: 60,
  reloadTime: 2.5,
  _modelRef: null,
  _mixer: null,
  _currentAction: null,
  _armsRef: null,

  init(game) {
    this.game = game;
    this.cooldown = 0;
    this.ammo = this.clip;
    this._modelRef = null;
    this._mixer = null;
    this._currentAction = null;
    this._armsRef = null;
    this.reserve = this.maxAmmo - this.ammo;
    var self = this;
    plugin.on('hotbar:select', this.id, function(data) {
      if (!data.slot || data.slot.id !== 'weapon_ak47') {
        if (self._armsRef) { self._armsRef.traverse(function(c) { if (c.isMesh) c.visible = true; }); self._armsRef = null; }
      }
    });
  },

  destroy() {
    plugin.off('hotbar:select', this.id);
  },

  setModelRef(model) {
    this._modelRef = model;
    this._mixer = model.userData.mixer || null;
    model.scale.set(0.08, 0.08, 0.08);
    model.position.set(0.35, -0.30, -0.18);
    model.rotation.set(-0.06, 3.1, 0.03);
    if (this._mixer) this._playClip('clip1');
  },

  setArmsRef(group) {
    if (this._armsRef && this._armsRef !== group) {
      this._armsRef.traverse(function(c) { if (c.isMesh) c.visible = true; });
    }
    this._armsRef = group;
    if (group) group.traverse(function(c) { if (c.isMesh) c.visible = false; });
  },

  getBarrelTip() {
    return this._modelRef || null;
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this.ammo <= 0) { plugin.emit('weapon:empty', { weapon: this }); return; }
    this.cooldown = this.cooldownTime;
    this.ammo--;
    plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.clip, clip: this.clip, reserve: this.reserve });
    this._playClip('shoot1');
    plugin.emit('weapon:fire', { weapon: this, owner: owner });
  },

  _playClip(name) {
    if (!this._mixer || !this._modelRef) return;
    var clips = this._modelRef.userData.clips;
    if (!clips) return;
    var clip = clips[name];
    if (!clip) return;
    if (this._currentAction) {
      this._currentAction.stop();
      this._currentAction = null;
    }
    this._currentAction = this._mixer.clipAction(clip);
    this._currentAction.play();
  },

  _onModelReady() {
    var mp = plugin.get('model_ak47');
    if (!mp || !mp._ready) return;
    var fp = plugin.get('fx_firstperson');
    if (!fp || !fp._viewGroup || !fp._arms) return;
    var slot = fp._arms.slot;
    if (!slot) return;
    var old = slot.getObjectByName('ak47_model');
    if (old) slot.remove(old);
    var model = mp.createModel();
    if (model.children.length === 0) return;
    slot.add(model);
    this.setModelRef(model);
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this._mixer) this._mixer.update(dt);
  }
});
