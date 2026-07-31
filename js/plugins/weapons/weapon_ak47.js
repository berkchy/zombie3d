var plugin = window.include('registry');

plugin.register({
  id: 'weapon_ak47',
  name: 'AK-47',
  version: '1.3',
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
  _armsRef: null,

  init(game) {
    this.game = game;
    this.cooldown = 0;
    this.ammo = this.clip;
    this._modelRef = null;
    this._mixer = null;
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
    model.scale.set(0.06, 0.06, 0.06);
    model.position.set(0.08, -0.22, -1.0);
    if (typeof model.rebindSkeleton === 'function') model.rebindSkeleton();
  },

  setArmsRef(group) {
    if (this._armsRef && this._armsRef !== group) {
      this._armsRef.traverse(function(c) { if (c.isMesh) c.visible = true; });
    }
    this._armsRef = group;
    if (!group) return;
    var slot = group.getObjectByName('fp_weapon_slot');
    group.traverse(function(c) {
      if (c.isMesh) {
        var p = c;
        while (p) {
          if (p === slot) return;
          p = p.parent;
        }
        c.visible = false;
      }
    });
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
    plugin.emit('weapon:fire', { weapon: this, owner: owner });
  },

  _playDraw: function() {
    var self = this;
    var clips = this._modelRef ? this._modelRef.userData.clips : null;
    if (clips && clips['draw']) {
      this._playClip('draw', {
        loop: false,
        speed: 'default',
        onComplete: function() { self._playClip('clip1'); }
      });
    } else {
      this._playClip('clip1');
    }
  },

  _playClip(name, opts) {
    if (!this._modelRef || typeof this._modelRef.playClip !== 'function') return null;
    return this._modelRef.playClip(name, opts);
  },

  _onModelReady() {
    console.log('[weapon_ak47] _onModelReady');
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
