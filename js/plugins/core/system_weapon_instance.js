var plugin = include('registry');

plugin.register({
  id: 'system_weapon_instance',
  name: 'Silah Kimlik Sistemi',
  type: 'core',
  version: '1.0',
  description: 'Her silah instancesi icin merkezi kayit — ammo/slot paylasimini engeller',
  enabled: true,
  priority: 80,

  _instances: null,

  init() {
    this._instances = {};
  },

  create(weaponId, ammo, maxAmmo, reserve) {
    var id = this._genId();
    this._instances[id] = {
      weapon_id: weaponId,
      ammo: ammo || 0,
      maxAmmo: maxAmmo || 0,
      reserve: reserve || 0,
      created: Date.now()
    };
    return id;
  },

  get(instanceId) {
    return this._instances[instanceId] || null;
  },

  update(instanceId, data) {
    var inst = this._instances[instanceId];
    if (!inst) return;
    if (data.ammo !== undefined) inst.ammo = data.ammo;
    if (data.reserve !== undefined) inst.reserve = data.reserve;
    if (data.maxAmmo !== undefined) inst.maxAmmo = data.maxAmmo;
  },

  remove(instanceId) {
    delete this._instances[instanceId];
  },

  _genId() {
    var id = Date.now().toString();
    for (var i = id.length; i < 16; i++) id += Math.floor(Math.random() * 10);
    return id.slice(-16);
  },

  destroy() {
    this._instances = null;
  }
});
