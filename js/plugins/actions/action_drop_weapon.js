var plugin = window.include('registry');
var loader = window.include('loader');

plugin.register({
  id: 'action_drop_weapon',
  name: 'Silah Atma',
  type: 'action',
  version: '1.0',
  description: 'G tusu + touch ile silah firlat',

  _dropMeshes: [],
  _keyHandler: null,
  _pickupKeyHandler: null,
  _wantPickup: false,
  _touchBtn: null,
  _game: null,

  styles:
    '#drop-pickup-hint{position:fixed;bottom:120px;left:50%;transform:translateX(-50%);z-index:200;color:#fff;font-family:monospace;font-size:13px;text-shadow:0 0 8px rgba(0,0,0,.9);background:rgba(0,0,0,.5);padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.1);display:none;}' +
    '#drop-pickup-hint .key{color:#4fc3f7;font-weight:bold;}' +
    '#drop-pickup-hint .wname{color:#ffd54f;}',

  init(game) {
    this._game = game;
    this._dropMeshes = [];

    var self = this;

    var _soundsRegistered = false;
    plugin.on('game:loaded', this.id + '_snd', function() {
      if (_soundsRegistered || !game.sound) return;
      _soundsRegistered = true;
      game.sound.addSound('looting', {
        randomPlay: true, currentIndex: 0, label: 'Yerden Alma', cat: 'ekstra',
        variants: [
          { src: ['audio/looting_1.mp3'], volume: 0.7 },
          { src: ['audio/looting_2.mp3'], volume: 0.7 },
          { src: ['audio/looting_3.mp3'], volume: 0.7 }
        ]
      });
      game.sound.addSound('weapon_drop', {
        label: 'Silah Atma', cat: 'ekstra',
        variants: [{ src: ['audio/weapon_drop.mp3'], volume: 0.7 }]
      });
      game.sound.addSound('weapon_bounce', {
        randomPlay: true, currentIndex: 0, label: 'Silah Sekme', cat: 'ekstra',
        variants: [
          { src: ['audio/weapon_bounce_1.mp3'], volume: 0.5 },
          { src: ['audio/weapon_bounce_2.mp3'], volume: 0.5 },
          { src: ['audio/weapon_bounce_3.mp3'], volume: 0.5 }
        ]
      });
    });

    this._keyHandler = function(e) {
      if (e.key === 'g' || e.key === 'G') {
        self._dropWeapon();
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    this._pickupKeyHandler = function(e) {
      if (e.key === 'e' || e.key === 'E') {
        self._wantPickup = true;
      }
    };
    document.addEventListener('keydown', this._pickupKeyHandler);

    var touch = plugin.get('system_touch_buttons');
    if (touch && touch.enabled) {
      this._touchBtn = touch.touchAdd('drop_weapon', {
        label: '', x: 92, y: 45, width: 56, height: 56,
        shape: 'circle', bgColor: 'rgba(180,50,50,.5)', color: '#fff',
        html: '<svg viewBox="0 0 40 40" width="22" height="22" fill="none" stroke="#fff" stroke-width="2"><path d="M8 12 L32 12 L29 34 C28.5 36 26 37 24 37 L16 37 C14 37 11.5 36 11 34 Z" stroke-linejoin="round"/><path d="M6 12 L34 12" stroke-width="2.5"/><rect x="16" y="6" width="8" height="6" rx="1"/><line x1="17" y1="18" x2="17" y2="32" stroke-width="1.8"/><line x1="23" y1="18" x2="23" y2="32" stroke-width="1.8"/><line x1="20" y1="18" x2="20" y2="32" stroke-width="1.8"/></svg>',
        onClick: function() { self._dropWeapon(); }
      });
      this._pickupBtn = touch.touchAdd('pickup_weapon', {
        label: '', x: 75, y: 45, width: 56, height: 56,
        shape: 'circle', bgColor: 'rgba(50,180,50,.5)', color: '#fff',
        html: '<svg viewBox="0 0 40 40" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.5"><circle cx="20" cy="20" r="3" fill="#fff"/><path d="M20 12 L20 28 M12 20 L28 20" stroke-linecap="round"/></svg>',
        hidden: true,
        onClick: function() { self._wantPickup = true; }
      });
    }

    var hint = document.createElement('div');
    hint.id = 'drop-pickup-hint';
    hint.innerHTML = 'Press <span class="key">E</span> to pick up <span class="wname"></span>';
    document.body.appendChild(hint);
  },

  _dropWeapon: function() {
    if (!this._game || !this._game.started) return;
    if (this._game._consoleOpen) return;
    var hotbar = this._game.hotbar;
    if (!hotbar) return;
    var sel = hotbar.getSelected();
    if (!sel || !sel.slot || !sel.slot.id) return;

    var wp = plugin.get(sel.slot.id);
    if (!wp || !wp.enabled) return;
    if (wp.weaponType === 'knife') return;

    var slot = sel.slot;
    var wId = slot.id;
    var wAmmo = slot.ammo;
    var wReserve = slot.reserve;
    var wInstanceId = slot.instanceId;

    var registry = plugin.get('system_weapon_instance');
    if (registry && registry.enabled && wInstanceId) {
      registry.update(wInstanceId, { ammo: wAmmo, reserve: wReserve });
    }

    var fp = plugin.get('fx_firstperson');
    if (fp && fp.enabled) {
      this._spawnDropped(wId, wAmmo, wReserve, wInstanceId, this._game.camera.position, this._game.camera.quaternion);
    } else {
      var player = this._game.player;
      if (!player || !player.mesh) return;
      var pos = player.mesh.position.clone();
      pos.y += 0.6;
      var yaw = this._game.fpYaw || player.mesh.rotation.y || 0;
      var q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
      this._spawnDropped(wId, wAmmo, wReserve, wInstanceId, pos, q);
    }
    if (this._game.sound) this._game.sound.play('weapon_drop');

    hotbar.clearSlot(sel.index);

    var newSlot = null;
    if (sel.index > 0) {
      hotbar.selectSlot(0);
      newSlot = hotbar.getSlot(0);
    } else if (hotbar.getSlot(1) && hotbar.getSlot(1).id) {
      hotbar.selectSlot(1);
      newSlot = hotbar.getSlot(1);
    } else {
      plugin.emit('hotbar:select', { index: -1, slot: { id: null } });
    }

    if (newSlot && newSlot.id) {
      var wp = plugin.get(newSlot.id);
      plugin.emit('ammo:change', { ammo: newSlot.ammo, maxAmmo: wp ? wp.maxAmmo : 0, clip: wp ? wp.clip : 0, reserve: newSlot.reserve });
    } else {
      plugin.emit('ammo:change', { ammo: 0, maxAmmo: 0, clip: 0, reserve: 0 });
    }
  },

  _spawnDropped: function(weaponId, ammo, reserve, instanceId, pos, quat) {
    var forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    var throwPos = pos.clone().add(forward.clone().multiplyScalar(0.6));
    throwPos.y = Math.max(0.15, throwPos.y);

    var wp = plugin.get(weaponId);
    var mp = wp && plugin.get(wp.modelId);
    var model = null;
    if (mp && typeof mp.createModel === 'function') {
      try { model = mp.createModel(); } catch (e) {}
    }

    if (!model) {
      var fallbackGeo = new THREE.BoxGeometry(0.12, 0.04, 0.16);
      var fallbackMat = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.6, roughness: 0.3 });
      model = new THREE.Mesh(fallbackGeo, fallbackMat);
    }

    model.position.copy(throwPos);
    model.rotation.set(0, Math.random() * Math.PI * 2, 0);
    model.scale.set(0.5, 0.5, 0.5);
    model.castShadow = true;
    this._game.scene.add(model);

    var vel = forward.clone().multiplyScalar(4 + Math.random() * 2);
    vel.y = 2 + Math.random() * 1.5;

    this._dropMeshes.push({
      mesh: model,
      vel: vel,
      weaponId: weaponId,
      ammo: ammo,
      reserve: reserve,
      instanceId: instanceId,
      life: 30,
      grounded: false,
      bounced: false
    });
  },

  update(dt) {
    if (!this._game || !this._game.scene) return;
    var toRemove = [];
    var nearDrop = null;
    var nearDist = Infinity;

    for (var i = 0; i < this._dropMeshes.length; i++) {
      var d = this._dropMeshes[i];
      d.life -= dt;

      if (d.life <= 0) {
        this._game.scene.remove(d.mesh);
        if (d.instanceId) {
          var registry = plugin.get('system_weapon_instance');
          if (registry && registry.enabled) registry.remove(d.instanceId);
        }
        toRemove.push(i);
        continue;
      }

      if (!d.grounded) {
        d.vel.y -= 9.8 * dt;
        d.mesh.position.x += d.vel.x * dt;
        d.mesh.position.z += d.vel.z * dt;
        d.mesh.position.y += d.vel.y * dt;

        d.mesh.rotation.x += d.vel.z * dt * 2;
        d.mesh.rotation.z -= d.vel.x * dt * 2;

        if (d.mesh.position.y <= 0.1) {
          d.mesh.position.y = 0.1;
          d.vel.y *= -0.3;
          d.vel.x *= 0.7;
          d.vel.z *= 0.7;
          if (!d.bounced) {
            d.bounced = true;
            if (this._game.sound) this._game.sound.play('weapon_bounce');
          }
          if (Math.abs(d.vel.y) < 0.3) {
            d.grounded = true;
            d.vel.set(0, 0, 0);
            d.mesh.rotation.x = 0;
            d.mesh.rotation.z = 0;
          }
        }
      }

      var dist = Infinity;
      if (this._game.player && this._game.player.mesh) {
        dist = this._game.player.mesh.position.distanceTo(d.mesh.position);
      }

      if (d.grounded && dist < nearDist) {
        nearDist = dist;
        nearDrop = d;
      }
    }

    var hint = document.getElementById('drop-pickup-hint');
    var showPickup = nearDrop && nearDist <= 1.2;

    if (hint) {
      if (showPickup) {
        var wp = plugin.get(nearDrop.weaponId);
        hint.querySelector('.wname').textContent = (wp && wp.name) || nearDrop.weaponId;
        hint.style.display = 'block';
      } else {
        hint.style.display = 'none';
      }
    }

    var touch = plugin.get('system_touch_buttons');
    if (this._pickupBtn && touch && touch.enabled) {
      touch.touchEdit('pickup_weapon', { hidden: !showPickup });
    }

    if (showPickup && nearDist < 1.2 && this._wantPickup) {
      this._pickupDropped(nearDrop);
      var idx = this._dropMeshes.indexOf(nearDrop);
      if (idx >= 0) {
        this._dropMeshes.splice(idx, 1);
      }
      if (hint) hint.style.display = 'none';
      if (this._pickupBtn && touch && touch.enabled) {
        touch.touchEdit('pickup_weapon', { hidden: true });
      }
    }

    this._wantPickup = false;

    for (var r = toRemove.length - 1; r >= 0; r--) {
      this._dropMeshes.splice(toRemove[r], 1);
    }
  },

  _pickupDropped: function(d) {
    var hotbar = this._game.hotbar;
    if (!hotbar) return;

    var existingIdx = -1;
    var emptyIdx = -1;
    for (var i = 0; i < 5; i++) {
      var s = hotbar.getSlot(i);
      if (s && s.id === d.weaponId) { existingIdx = i; break; }
      if (emptyIdx < 0 && (!s || !s.id)) emptyIdx = i;
    }

    var replaceIdx = existingIdx >= 0 ? existingIdx : emptyIdx;
    if (replaceIdx < 0) { this._game.scene.remove(d.mesh); return; }

    if (existingIdx >= 0) {
      var fp = plugin.get('fx_firstperson');
      var dropPos, dropQ;
      if (fp && fp.enabled) {
        dropPos = this._game.camera.position;
        dropQ = this._game.camera.quaternion;
      } else {
        var player = this._game.player;
        if (player && player.mesh) {
          dropPos = player.mesh.position.clone();
          dropPos.y += 0.6;
          var yaw = this._game.fpYaw || player.mesh.rotation.y || 0;
          dropQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
        } else {
          dropPos = this._game.camera.position;
          dropQ = this._game.camera.quaternion;
        }
      }
      var oldSlot = hotbar.getSlot(existingIdx);
      var registry = plugin.get('system_weapon_instance');
      if (registry && registry.enabled && oldSlot.instanceId) {
        registry.update(oldSlot.instanceId, { ammo: oldSlot.ammo, reserve: oldSlot.reserve });
      }
      this._spawnDropped(oldSlot.id, oldSlot.ammo, oldSlot.reserve, oldSlot.instanceId, dropPos, dropQ);
      hotbar.clearSlot(existingIdx);
      if (this._game.sound) this._game.sound.play('weapon_drop');
    }

    hotbar.setSlot(replaceIdx, d.weaponId, d.instanceId);
    var slot = hotbar.getSlot(replaceIdx);
    var wp = plugin.get(d.weaponId);
    if (slot) {
      var wasSelected = hotbar.getSelected();
      hotbar.selectSlot(replaceIdx);
      if (wp) { wp.ammo = slot.ammo; wp.reserve = slot.reserve; }
      if (wasSelected && wasSelected.index === replaceIdx) {
        plugin.emit('hotbar:select', { index: replaceIdx, slot: { id: d.weaponId, ammo: slot.ammo, reserve: slot.reserve } });
      }
      plugin.emit('ammo:change', {
        ammo: slot.ammo,
        maxAmmo: wp ? wp.maxAmmo : 0,
        clip: wp ? wp.clip : 0,
        reserve: slot.reserve
      });
      if (this._game.sound && existingIdx < 0) this._game.sound.play('looting');
    }

    this._game.scene.remove(d.mesh);
  },

  destroy() {
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    if (this._pickupKeyHandler) document.removeEventListener('keydown', this._pickupKeyHandler);
    plugin.off('game:loaded', this.id + '_snd');
    var touch = plugin.get('system_touch_buttons');
    if (touch && touch.enabled) {
      touch.touchRemove('drop_weapon');
      touch.touchRemove('pickup_weapon');
    }
    for (var i = 0; i < this._dropMeshes.length; i++) {
      if (this._dropMeshes[i].mesh && this._game) {
        this._game.scene.remove(this._dropMeshes[i].mesh);
      }
    }
    this._dropMeshes = [];
    var hint = document.getElementById('drop-pickup-hint');
    if (hint) hint.remove();
  }
});
