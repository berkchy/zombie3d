PluginRegistry.register({
  id: 'weapon_knife',
  name: 'Bıçak',
  version: '1.0',
  type: 'weapon',
  weaponType: 'knife',
  modelId: 'model_knife',
  description: 'Yakın dövüş — önündeki zombileri keser',

  cooldown: 0,
  cooldownTime: 0.5,
  range: 2.2,
  damage: 60,
  arcAngle: 1.2,

  init(game) {
    this.game = game;
    this.cooldown = 0;
  },

  shoot(owner) {
    if (this.cooldown > 0) return;
    this.cooldown = this.cooldownTime;

    var zp = PluginRegistry.get('zombie_basic');
    if (!zp || !zp.enabled || !zp.zombies) return;

    var pos = owner.mesh.position.clone();
    pos.y += 0.35;

    var forward = new THREE.Vector3(0, 0, 1);
    var fp = PluginRegistry.get('fx_firstperson');
    if (fp && fp.enabled) {
      forward.set(0, 0, -1);
      forward.applyQuaternion(this.game.camera.quaternion);
    } else {
      forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), owner.mesh.rotation.y);
    }

    var hitCount = 0;

    for (var i = 0; i < zp.zombies.length; i++) {
      var z = zp.zombies[i];
      if (!z.alive || z.dying) continue;

      var toZombie = new THREE.Vector3().copy(z.mesh.position).sub(pos);
      var dist = toZombie.length();
      if (dist > this.range) continue;

      toZombie.normalize();
      var angle = forward.angleTo(toZombie);
      if (angle > this.arcAngle) continue;

      z.hp -= this.damage;
      hitCount++;

      PluginRegistry.emit('zombie:hit', {
        zombie: z,
        damage: this.damage,
        hp: z.hp,
        position: z.mesh.position.clone()
      });

      if (z.hp <= 0) {
        z.dying = true;
        z.dieTimer = 1.6;
        this.game.score += 10;
        document.getElementById('scoreVal').textContent = this.game.score;

        var anim = PluginRegistry.get('core_animation');
        var mp = PluginRegistry.get('model_zombie');
        if (anim && anim.enabled && mp && mp.animations && z._animId) {
          anim.stop(z._animId);
          z._animId = null;
        }
        if (anim && anim.enabled && mp && mp.animations) {
          z._animId = anim.play(z.mesh, mp.animations.die);
        }
        PluginRegistry.emit('zombie:die', z.mesh.position.clone());
      }
    }

    PluginRegistry.emit('weapon:fire', {
      weapon: this,
      range: this.range,
      hits: hitCount
    });
  },

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
  },

  destroy() {}
});
