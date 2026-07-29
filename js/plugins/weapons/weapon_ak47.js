var plugin = window.include('registry');
var loader = window.include('loader');

plugin.register({
  id: 'weapon_ak47',
  name: 'AK-47',
  version: '1.0',
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

  init(game) {
    loader.loadScript('model_ak47', function(){});
    this.game = game;
    this.cooldown = 0;
    this.ammo = this.clip;
    this._modelRef = null;
    this._mixer = null;
    this._currentAction = null;
    this.reserve = this.maxAmmo - this.ammo;
  },

  setModelRef(model) {
    this._modelRef = model;
    this._mixer = model.userData.mixer || null;
    if (this._mixer) this._playClip('idle');
  },

  setArmsRef() {},

  getBarrelTip() {
    return this._modelRef || null;
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this.ammo <= 0) { plugin.emit('weapon:empty', { weapon: this }); return; }
    this.cooldown = this.cooldownTime;
    this.ammo--;
    plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.clip, clip: this.clip, reserve: this.reserve });
    this._playClip('shoot');
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

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this._mixer) this._mixer.update(dt);
  }
});
