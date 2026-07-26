var plugin = include('registry');

plugin.register({
  id: 'player_movement',
  name: 'Karakter Hareketi',
  type: 'player',
  version: '2.0',
  description: 'Oyuncu hareketi + harita collider + yuru',
  priority: 20,
  enabled: true,

  speed: 5,
  velX: 0,
  velZ: 0,
  velocityY: 0,
  gravity: -9.8,
  jumpForce: 4,
  onGround: false,
  _floorY: 0,
  accel: 20,
  friction: 12,
  _stepTimer: 0,
  crouching: false,

  init(game) {
    this.game = game;
    if (!game.input) game.input = { x: 0, y: 0 };
    this.velX = 0;
    this.velZ = 0;
    this.velocityY = 0;
    this.onGround = false;
    this._floorY = 0;
    this._stepTimer = 0;
    this._walkFading = false;
    this._fallStartY = null;
    this._wasOnGround = false;
    this.crouching = false;
    if (game.player) game.player._gravityMultiplier = 1.0;

    var self = this;
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Control') {
        e.preventDefault();
        if (!self.crouching) {
          self.crouching = true;
          self.speed = 2.5;
        }
      }
    });
    document.addEventListener('keyup', function(e) {
      if (e.key === 'Control') {
        self.crouching = false;
        self.speed = 5;
      }
    });

    var self = this;
    plugin.on('game:loaded', this.id, function() {
      if (self.game && self.game.sound) {
        self.game.sound.addSound('player_walk', {
          randomPlay: true, currentIndex: 0, label: 'Yürüme Sesi', cat: 'oyuncu',
          variants: [
            { src: ['audio/player_walk_1.mp3'], volume: 0.4 },
            { src: ['audio/player_walk_2.mp3'], volume: 0.4 },
            { src: ['audio/player_walk_3.mp3'], volume: 0.4 },
            { src: ['audio/player_walk_4.mp3'], volume: 0.4 },
            { src: ['audio/player_walk_5.mp3'], volume: 0.4 }
          ]
        });
      }
    });
    game.move = {
      get speed() { return self.speed; },
      setSpeed: function(v) { self.speed = v; }
    };
  },

  update(dt) {
    var mesh = game.playerMesh;
    if (!mesh) return;
    if (game && game._dying) return;

    var inputX = game.input.x;
    var inputZ = game.input.y;
    var isMoving = inputX !== 0 || inputZ !== 0;

    if (isMoving) {
      if (this._walkFading) {
        this._walkFading = false;
        this._restoreWalkVolume();
      }
      this._stepTimer -= dt;
      if (this._stepTimer <= 0 && this.onGround) {
        this._stepTimer = 0.4;
        if (this.game && this.game.sound) this.game.sound.play('player_walk');
      }
      var targetVX, targetVZ;
      var fp = plugin.get('fx_firstperson');
      if (fp && fp.enabled && mesh.rotation.y !== undefined) {
        var yaw = mesh.rotation.y;
        var cosY = Math.cos(yaw);
        var sinY = Math.sin(yaw);
        targetVX = (inputX * cosY + inputZ * sinY) * this.speed;
        targetVZ = (-inputX * sinY + inputZ * cosY) * this.speed;
      } else {
        targetVX = inputX * this.speed;
        targetVZ = inputZ * this.speed;
      }

      var diffX = targetVX - this.velX;
      var diffZ = targetVZ - this.velZ;
      var diffLen = Math.sqrt(diffX * diffX + diffZ * diffZ);

      if (diffLen > 0.001) {
        var maxAccel = this.accel * dt;
        if (maxAccel > diffLen) maxAccel = diffLen;
        this.velX += (diffX / diffLen) * maxAccel;
        this.velZ += (diffZ / diffLen) * maxAccel;
      }
    } else {
      if (!this._walkFading && this.game && this.game.sound) {
        this._walkFading = true;
        this.game.sound.fadeOut('player_walk', 100);
      }
      var spd = Math.sqrt(this.velX * this.velX + this.velZ * this.velZ);
      if (spd > 0.001) {
        var decay = this.friction * dt;
        if (decay > spd) decay = spd;
        this.velX -= (this.velX / spd) * decay;
        this.velZ -= (this.velZ / spd) * decay;
      }
    }

    // Mesh Collider + Gravity
    var mapPluginId = game.currentMap ? 'map_' + game.currentMap.id : null;
    var map = mapPluginId ? plugin.get(mapPluginId) : null;
    if (game.scene) game.scene.updateMatrixWorld(true);
    var meshes = map ? MeshCollider.collectMapMeshes(map) : null;
    var floorY = null;
    var pr = 0.3, stepH = 0.4;
    var nx = mesh.position.x + this.velX * dt;
    var nz = mesh.position.z + this.velZ * dt;
    if (meshes && meshes.length > 0) {
      var result = MeshCollider.slideMove(
        mesh.position.x, mesh.position.y, mesh.position.z,
        this.velX * dt, this.velZ * dt,
        meshes, pr, stepH
      );
      nx = result.x; nz = result.z;

      floorY = MeshCollider.getFloorY(nx, mesh.position.y, nz, meshes, stepH);

      // Dynamic colliders (entity colliders, kept for dropbox etc.)
      if (game._dynamicColliders) {
        for (var ci = 0; ci < game._dynamicColliders.length; ci++) {
          var c = game._dynamicColliders[ci];
          var maxY = c.max[1];
          if (mesh.position.y >= maxY - 0.3) {
            if (ColliderHelper.pointInBox(nx, nz, c)) {
              if (floorY === null || maxY > floorY) floorY = maxY;
            }
          } else {
            var r = ColliderHelper.circleVsBox(nx, nz, pr, c);
            if (r.x !== nx || r.z !== nz) {
              var diffX = nx - r.x, diffZ = nz - r.z;
              var diffLen = Math.sqrt(diffX * diffX + diffZ * diffZ);
              if (diffLen > 0.001) {
                nx = r.x; nz = r.z;
              }
            }
          }
        }
      }
    }

    // Jump – only if on ground and triggered this frame
    var wantJump = game.input.jump;
    game.input.jump = false;
    var wasOnGround = this.onGround;
    if (wantJump && this.onGround) {
      this.velocityY = this.jumpForce;
      this.onGround = false;
    }
    if (wantJump) {
      plugin.emit('player:jumpPress', { wasOnGround: wasOnGround });
    }

    // Gravity
    var gravMult = (game.player && game.player._gravityMultiplier) || 1;
    this.velocityY += this.gravity * gravMult * dt;
    var ny = mesh.position.y + this.velocityY * dt;

    // Ground clamp
    if (floorY !== null) {
      if (ny <= floorY) {
        ny = floorY;
        this.velocityY = 0;

        if (!this._wasOnGround && this._fallStartY !== null) {
          var fallDist = this._fallStartY - ny;
          if (fallDist > 3) {
            var dmg = Math.round((fallDist - 3) * 20);
            dmg = Math.min(999, Math.max(1, dmg));
            if (game.player && game.player.takeDamage) {
              game.player.takeDamage(dmg);
            }
          }
          this._fallStartY = null;
        }

        this.onGround = true;
        this._wasOnGround = true;
      } else if (this.onGround) {
        this._fallStartY = mesh.position.y;
        this.onGround = false;
        this._wasOnGround = false;
      }
    }
    this._floorY = (floorY !== null) ? floorY : this._floorY;
    mesh.position.y = ny;

    // Sinir kontrolu (yedek)
    var half = 28;
    mesh.position.x = Math.max(-half, Math.min(half, nx));
    mesh.position.z = Math.max(-half, Math.min(half, nz));

    var speed = Math.sqrt(this.velX * this.velX + this.velZ * this.velZ);
    plugin.emit('player:moving', {
      x: mesh.position.x,
      z: mesh.position.z,
      dx: this.velX,
      dz: this.velZ,
      speed: speed,
      crouching: this.crouching
    });
  },

  _restoreWalkVolume: function() {
    if (!this.game || !this.game.sound) return;
    var snd = this.game.sound;
    var howls = snd._sounds['player_walk'];
    if (!howls) return;
    var saved = PluginStorageAPI.get('ss_vol_player_walk', null);
    var vol = saved !== null ? parseInt(saved, 10) / 100 : 0.4;
    for (var i = 0; i < howls.length; i++) {
      if (howls[i]) howls[i].volume(vol);
    }
  },

});
