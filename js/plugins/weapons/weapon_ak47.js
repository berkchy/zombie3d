var plugin = window.include('registry');
var loader = window.include('loader');

plugin.register({
  id: 'weapon_ak47',
  name: 'AK-47',
  version: '1.0',
  type: 'weapon',
  weaponType: 'rifle',
  modelId: 'model_ak47',
  description: 'AK-47 viewmodel from Half-Life .mdl',

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
  _armsRef: null,
  _animId: null,
  _animArmId: null,
  _restPose: null,
  _equipping: false,

  _armAnims: {
    fire: { duration: 0.3, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.z', keys: [0, 0.03, 0.005, 0] },
      { pivot: '__self__', prop: 'position.y', keys: [0, 0.015, -0.003, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.1, -0.01, 0] }
    ]},
    reload: { duration: 2.0, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.y', keys: [0, -0.1, -0.1, -0.04, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0, 0.08, 0.06, 0.02, 0] }
    ]},
    equip: { duration: 2.0, loop: false, tracks: [
      { pivot: '__self__', prop: 'position.y', keys: [-0.7, -0.6, -0.4, -0.15, -0.02, 0] },
      { pivot: '__self__', prop: 'position.z', keys: [0.5, 0.4, 0.25, 0.1, 0.02, 0] },
      { pivot: '__self__', prop: 'rotation.x', keys: [0.7, 0.5, 0.25, 0.08, 0.01, 0] }
    ]}
  },

  init(game) {
    loader.loadScript('model_ak47', function(){});
    this.game = game;
    this.cooldown = 0;
    this.ammo = this.clip;
    this._modelRef = null;
    this._animId = null;
    this._animArmId = null;
    this._restPose = null;
    this._equipping = false;
    this.reserve = this.maxAmmo - this.ammo;
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    if (this.ammo <= 0) { plugin.emit('weapon:empty', { weapon: this }); return; }
    this.cooldown = this.cooldownTime;
    this.ammo--;
    plugin.emit('ammo:change', { ammo: this.ammo, maxAmmo: this.clip, clip: this.clip, reserve: this.reserve });
    this._playAnim('fire');
    plugin.emit('weapon:fire', { weapon: this, owner: owner });
  },

  setModelRef: function(model) {
    this._modelRef = model;
    var a = plugin.get('core_animation');
    if (this._animId && a && a.stop) a.stop(this._animId);
    this._animId = null;
    this._restPose = model.position.clone();
    this._equipping = true;
    this._playAnim('equip');
  },

  setArmsRef: function(group) {
    this._armsRef = group;
  },

  getBarrelTip: function() {
    if (!this._modelRef) return null;
    return this._modelRef.getObjectByName('barrel_tip') || this._modelRef;
  },

  _resetToRestPose: function() {
    if (!this._modelRef || !this._restPose) return;
    this._modelRef.position.copy(this._restPose);
    this._modelRef.rotation.set(-0.08, 3.0, 0.05);
  },

  _playAnim: function(name) {
    var anim = this._armAnims[name];
    if (!anim) return;
    var a = plugin.get('core_animation');
    if (!a || !a.enabled) return;
    var target = this._armsRef || this._modelRef;
    if (!target) return;
    if (this._animArmId) { a.stop(this._animArmId); this._animArmId = null; }
    this._animArmId = a.play(target, anim);
  },

  update: function(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this._equipping) {
      var a = plugin.get('core_animation');
      if (this._animArmId && a && !a.isPlaying(this._animArmId)) {
        this._equipping = false;
        this._resetToRestPose();
      }
    }
  }
});
