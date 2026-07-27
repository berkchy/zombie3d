var plugin = include('registry');

plugin.register({
  id: 'fx_dismember',
  name: 'Dismemberment',
  type: 'graphics',
  version: '1.0',
  description: 'Zombi parcalanmasi — kafa/kol/bacak kopar',
  priority: 12,

  _parts: [],

  init() {
    this._parts = [];

    var self = this;
    // zombie:die emits pos + gets called when zombie dies
    // We need hitType info, so hook into zombie:hit which fires before die
    plugin.on('zombie:hit', this.id, function(data) {
      if (!data || !data.zombie || !data.zombie.mesh) return;
      // Store hit info on the zombie object for use on death
      data.zombie._lastHitType = data.hitType;
      data.zombie._lastDmg = data.damage;
    });

    plugin.on('zombie:die', this.id, function(pos) {
      if (!pos) return;
      // Find zombie with matching position
      var zb = plugin.get('zombie_basic');
      if (!zb || !zb.enabled || !zb.zombies) return;
      for (var i = 0; i < zb.zombies.length; i++) {
        var z = zb.zombies[i];
        if (!z || !z.mesh) continue;
        // Give a small grace period: only sever if hit was recent & fatal
        var dist = z.mesh.position.distanceTo(pos);
        if (dist < 0.5 && z._lastHitType) {
          self._sever(z, z._lastHitType);
          z._lastHitType = null;
          break;
        }
      }
    });

    // Also handle boss (single boss object, not array)
    plugin.on('boss:die', this.id, function(pos) {
      if (!pos) return;
      var bossP = plugin.get('zombie_boss');
      if (!bossP || !bossP.enabled || !bossP.boss) return;
      var z = bossP.boss;
      if (!z || !z.mesh) return;
      var dist = z.mesh.position.distanceTo(pos);
      if (dist < 0.5) {
        self._sever(z, z._lastHitType || 'chest');
        z._lastHitType = null;
      }
    });
  },

  _sever(zombie, hitType) {
    if (!game || !game.scene) return;
    var mesh = zombie.mesh;

    // Map hitType to pivot name(s)
    var pivotMap = {
      head: ['head'],
      arm: ['armL', 'armR'],
      leg: ['legL', 'legR'],
      foot: ['legL', 'legR'],
      chest: null
    };

    var pivotsToSever = pivotMap[hitType] || null;
    if (!pivotsToSever) return;

    // Pick which side for arm/leg (if stored side info exists, else random)
    var sides;
    if (hitType === 'head') {
      sides = pivotsToSever; // just 'head'
    } else {
      // Try to pick based on which hitbox was closer, or random
      var idx = Math.floor(Math.random() * pivotsToSever.length);
      sides = [pivotsToSever[idx]];
    }

    var blood = plugin.get('fx_blood_splatter');

    for (var s = 0; s < sides.length; s++) {
      var pivot = mesh.getObjectByName(sides[s]);
      if (!pivot) continue;

      // Get world transform before detaching
      var worldPos = new THREE.Vector3();
      var worldQuat = new THREE.Quaternion();
      var worldScale = new THREE.Vector3();
      pivot.getWorldPosition(worldPos);
      pivot.getWorldQuaternion(worldQuat);
      pivot.getWorldScale(worldScale);

      // Clone children into a detached group
      var detached = new THREE.Group();
      detached.name = 'detached_' + sides[s];

      var children = pivot.children.slice();
      for (var c = 0; c < children.length; c++) {
        var child = children[c];
        // Skip hitbox meshes and non-visible helpers
        if (child.userData && child.userData.hitbox) continue;
        if (child.isMesh || child.isGroup) {
          var clone = child.clone();
          // Copy world matrix
          var childWorldPos = new THREE.Vector3();
          var childWorldQuat = new THREE.Quaternion();
          child.getWorldPosition(childWorldPos);
          child.getWorldQuaternion(childWorldQuat);
          var childScale = new THREE.Vector3();
          child.getWorldScale(childScale);
          clone.position.copy(childWorldPos);
          clone.quaternion.copy(childWorldQuat);
          clone.scale.copy(childScale);
          clone.renderOrder = 99;
          detached.add(clone);
          // Hide original
          child.visible = false;
        }
      }

      // Add a blood chunk at the pivot point
      var chunkMat = new THREE.MeshStandardMaterial({
        color: 0x661122,
        roughness: 0.9,
        emissive: 0x330000,
        emissiveIntensity: 0.2
      });
      var chunk = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), chunkMat);
      chunk.position.set(0, 0, 0);
      chunk.name = 'chunk';
      detached.add(chunk);

      // Hide the pivot itself if it has visible meshes
      if (pivot.isMesh) pivot.visible = false;

      game.scene.add(detached);

      // Physics
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 4;
      this._parts.push({
        group: detached,
        vx: Math.cos(angle) * speed,
        vy: 2 + Math.random() * 4,
        vz: Math.sin(angle) * speed,
        rotSpeed: {
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 6,
          z: (Math.random() - 0.5) * 8
        },
        life: 4,
        maxLife: 4,
        landed: false
      });

      // Blood fountain!
      if (blood && blood._spray) {
        blood._spray(worldPos, hitType === 'head' ? 18 : 10);
        blood._pool(worldPos);
      }
    }

    // Always sever head on headshot; also add extra blood
    if (hitType === 'head') {
      // Additional blood burst at head level
      var headPivot = mesh.getObjectByName('head');
      if (headPivot) {
        var headPos = new THREE.Vector3();
        headPivot.getWorldPosition(headPos);
        if (blood && blood._spray) {
          blood._spray(headPos, 25);
        }
      }
    }
  },

  update(dt) {
    if (!game || !game.scene || !this._parts.length) return;
    var scene = game.scene;
    for (var i = this._parts.length - 1; i >= 0; i--) {
      var p = this._parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.group);
        p.group.traverse(function(m) {
          if (m.isMesh) {
            if (m.geometry) m.geometry.dispose();
            if (m.material) m.material.dispose();
          }
        });
        this._parts.splice(i, 1);
        continue;
      }

      // Position
      p.group.position.x += p.vx * dt;
      p.group.position.y += p.vy * dt;
      p.vy -= 6 * dt;
      p.group.position.z += p.vz * dt;

      // Rotation
      p.group.rotation.x += p.rotSpeed.x * dt;
      p.group.rotation.y += p.rotSpeed.y * dt;
      p.group.rotation.z += p.rotSpeed.z * dt;

      // Rot damping
      p.rotSpeed.x *= 0.98;
      p.rotSpeed.y *= 0.98;
      p.rotSpeed.z *= 0.98;

      // Bounce on ground
      if (p.group.position.y < 0) {
        p.group.position.y = 0;
        if (!p.landed) {
          p.landed = true;
          p.vy *= -0.3;
          p.vx *= 0.5;
          p.vz *= 0.5;
          if (Math.abs(p.vy) < 0.5) p.vy = 0;
        } else {
          p.vx *= 0.9;
          p.vz *= 0.9;
          p.vy = 0;
        }
      }

      // Fade out in last second
      var t = p.life / p.maxLife;
      if (t < 0.2) {
        var alpha = t / 0.2;
        p.group.traverse(function(m) {
          if (m.isMesh && m.material) {
            m.material.transparent = true;
            m.material.opacity = alpha;
          }
        });
      }
    }
  },

  destroy() {
    var scene = game ? game.scene : null;
    for (var i = 0; i < this._parts.length; i++) {
      if (this._parts[i].group && scene) scene.remove(this._parts[i].group);
    }
    this._parts = [];
    plugin.off('zombie:hit', this.id);
    plugin.off('zombie:die', this.id);
    plugin.off('boss:die', this.id);
  }
});
