var plugin = include('registry');

plugin.register({
  id: 'system_wave_manager',
  name: 'Dalga Yöneticisi',
  type: 'core',
  version: '2.0',
  description: 'Dalga ilerlemesi — kill-based, her 5 waveda boss',
  priority: -50,

  game: null,
  wave: 0,
  phase: 'idle',
  zombiesSpawned: 0,
  zombiesKilled: 0,
  totalZombies: 0,
  spawnTimer: 0,

  container: null,
  waveEl: null,
  countEl: null,
  statusEl: null,

  styles:
    '#waveUI{position:fixed;top:48px;left:50%;transform:translateX(-50%);z-index:35;display:none;flex-direction:column;align-items:center;gap:4px;pointer-events:none;user-select:none;}' +
    '#waveUI.show{display:flex;}' +
    '.wu-wave{font-size:13px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.5);text-transform:uppercase;}' +
    '.wu-wave.boss{color:#ff6f00;text-shadow:0 0 20px rgba(255,111,0,0.4);}' +
    '.wu-wave span{color:#4fc3f7;font-size:18px;}' +
    '.wu-wave.boss span{color:#ff6f00;}' +
    '.wu-count{font-size:11px;font-weight:600;color:rgba(255,255,255,0.25);letter-spacing:1px;}' +
    '.wu-count span{color:rgba(255,255,255,0.7);font-weight:700;}' +
    '.wu-status{font-size:10px;color:rgba(255,255,255,0.15);letter-spacing:0.5px;margin-top:2px;}' +
    '.wu-status.boss-warn{color:#ff6f00;font-weight:700;text-shadow:0 0 12px rgba(255,111,0,0.3);}',

  init(game) {
    this.game = game;
    this.wave = 0;
    this.phase = 'idle';
    this.zombiesSpawned = 0;
    this.zombiesKilled = 0;
    this.totalZombies = 0;
    this.spawnTimer = 0;

    var c = document.createElement('div');
    c.id = 'waveUI';
    this.container = c;

    var wu = document.createElement('div');
    wu.className = 'wu-wave';
    wu.innerHTML = 'DALGA <span id="wuWaveVal">0</span>';
    this.waveEl = wu;
    c.appendChild(wu);

    var ct = document.createElement('div');
    ct.className = 'wu-count';
    ct.id = 'wuCount';
    this.countEl = ct;
    c.appendChild(ct);

    var st = document.createElement('div');
    st.className = 'wu-status';
    this.statusEl = st;
    c.appendChild(st);

    document.body.appendChild(c);

    var self = this;
    plugin.on('zombie:die', this.id, function() {
      self._onZombieKilled();
    });
    plugin.on('boss:die', this.id, function() {
      self._onBossKilled();
    });
    plugin.on('game:start', this.id, function() {
      self.wave = 0;
      self.phase = 'idle';
      self._startNextWave();
    });
    plugin.on('game:over', this.id, function() {
      self.phase = 'idle';
      c.classList.remove('show');
    });
    plugin.on('game:restart', this.id, function() {
      self.phase = 'idle';
      c.classList.remove('show');
    });
  },

  _getTotalForWave(wave) {
    if (wave % 5 === 0) return Math.floor((3 + wave * 2) / 2);
    return 3 + wave * 2;
  },

  _getWaveConfig(wave) {
    return {
      hp: 20 + (wave - 1) * 5,
      maxHp: 20 + (wave - 1) * 5,
      speed: 2 + (wave - 1) * 0.2,
      damage: 5 + (wave - 1) * 1
    };
  },

  _startNextWave() {
    this.wave++;
    this.zombiesSpawned = 0;
    this.zombiesKilled = 0;
    this.totalZombies = this._getTotalForWave(this.wave);
    this.spawnTimer = 1.0;

    var isBoss = this.wave % 5 === 0;
    this.phase = isBoss ? 'boss_prep' : 'active';

    this.waveEl.className = 'wu-wave' + (isBoss ? ' boss' : '');
    this.waveEl.innerHTML = (isBoss ? '☠ BOSS DALGA ' : 'DALGA ') + '<span>' + this.wave + '</span>';
    this.countEl.innerHTML = 'Zombi: <span id="wuKilled">0</span> / <span id="wuTotal">' + this.totalZombies + '</span>';
    this.statusEl.textContent = isBoss ? 'Tüm zombileri öldür, sonra boss geliyor!' : '';
    this.statusEl.className = 'wu-status' + (isBoss ? ' boss-warn' : '');
    this.container.classList.add('show');

    plugin.emit('wave:change', { oldWave: this.wave - 1, newWave: this.wave });
  },

  _onZombieKilled() {
    if (this.phase === 'idle') return;
    if (this.game && this.game.poligonMode) return;
    if (this.zombiesKilled >= this.totalZombies) return;
    this.zombiesKilled++;
    var killedEl = document.getElementById('wuKilled');
    if (killedEl) killedEl.textContent = this.zombiesKilled;

    if (this.zombiesKilled >= this.totalZombies) {
      if (this.phase === 'boss_prep') {
        this.phase = 'boss_spawn';
        this.statusEl.textContent = 'BOSS GELIYOR!';
        this.statusEl.className = 'wu-status boss-warn';
        plugin.emit('boss:spawn', { wave: this.wave });
      } else {
        this.phase = 'idle';
        this.statusEl.textContent = 'DALGA TAMAMLANDI!';
        plugin.emit('wave:complete', { wave: this.wave });
        var self = this;
        setTimeout(function() { self._startNextWave(); }, 2000);
      }
    }
  },

  _onBossKilled() {
    if (this.phase !== 'boss_spawn') return;
    this.phase = 'idle';
    this.statusEl.textContent = 'BOSS ÖLDÜ!';
    plugin.emit('wave:complete', { wave: this.wave });
    var self = this;
    setTimeout(function() { self._startNextWave(); }, 2500);
  },

  update(dt) {
    if (!this.game || !this.game.player) return;
    if (!this.game.started) return;

    if (this.game.poligonMode) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 2.0;
        plugin.emit('wave:spawn', {
          count: 1, hp: 20, maxHp: 20, speed: 2, damage: 5,
          wave: 0, poligon: true
        });
      }
      return;
    }

    if (this.phase !== 'active' && this.phase !== 'boss_prep') return;

    if (this.zombiesSpawned < this.totalZombies) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 0.8;
        var config = this._getWaveConfig(this.wave);
        var toSpawn = Math.min(2, this.totalZombies - this.zombiesSpawned);
        this.zombiesSpawned += toSpawn;
        plugin.emit('wave:spawn', {
          count: toSpawn,
          hp: config.hp,
          maxHp: config.maxHp,
          speed: config.speed,
          damage: config.damage,
          wave: this.wave,
          poligon: false
        });
      }
    }
  },

  destroy() {
    if (this.container) this.container.remove();
    plugin.off('zombie:die', this.id);
    plugin.off('boss:die', this.id);
    plugin.off('game:start', this.id);
    plugin.off('game:over', this.id);
    plugin.off('game:restart', this.id);
    plugin.removeStyles(this.id);
    this.wave = 0;
  }
});
