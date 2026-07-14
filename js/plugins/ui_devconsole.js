PluginRegistry.register({
  id: 'ui_devconsole',
  name: 'Geliştirici Konsolu',
  type: 'core',
  version: '1.1',
  description: 'Oyun içi konsol — hata/log mesajları, komut girişi',
  enabled: true,
  priority: -999,

  styles:
    '#devconsole{position:fixed;bottom:60px;right:10px;width:420px;max-height:320px;background:rgba(10,10,18,0.94);border:1px solid rgba(255,255,255,0.08);border-radius:8px;z-index:250;display:none;flex-direction:column;backdrop-filter:blur(8px);font-family:monospace;font-size:10px;overflow:visible;}' +
    '#devconsole.open{display:flex;}' +
    '#devconsole-header{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid rgba(255,255,255,0.06);color:#888;font-size:10px;letter-spacing:1px;flex-shrink:0;cursor:move;user-select:none;}' +
    '#devconsole-header span{pointer-events:none;}' +
    '#devconsole-clear{background:none;border:none;color:#555;cursor:pointer;font-size:11px;padding:0 4px;pointer-events:auto;}' +
    '#devconsole-clear:hover{color:#ccc;}' +
    '#devconsole-body{flex:1;overflow-y:auto;padding:4px 6px;min-height:40px;max-height:180px;}' +
    '#devconsole-body div{padding:2px 4px;border-bottom:1px solid rgba(255,255,255,0.02);line-height:1.4;word-break:break-all;white-space:pre-wrap;}' +
    '#devconsole-body .log-debug{color:#888;}' +
    '#devconsole-body .log-info{color:#4fc3f7;}' +
    '#devconsole-body .log-warn{color:#ffa726;}' +
    '#devconsole-body .log-error{color:#ef5350;}' +
    '#devconsole-body .log-plugin{color:#81c784;}' +
    '#devconsole-body .log-ok{color:#66bb6a;}' +
    '#devconsole-body .log-cmd{color:#ce93d8;}' +
    '#devconsole-body .log-output{color:#aaa;}' +
    '#devconsole-input-area{display:flex;border-top:1px solid rgba(255,255,255,0.06);padding:4px;flex-shrink:0;position:relative;}' +
    '#devconsole-input{flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:4px;color:#ccc;font-family:monospace;font-size:11px;padding:5px 8px;outline:none;}' +
    '#devconsole-input:focus{border-color:rgba(79,195,247,0.3);}' +
    '#devconsole-input::placeholder{color:rgba(255,255,255,0.15);}' +
    '#devconsole-suggest{position:absolute;bottom:100%;right:2px;left:2px;max-height:120px;overflow-y:auto;background:rgba(15,15,24,0.97);border:1px solid rgba(255,255,255,0.08);border-radius:6px;display:none;z-index:252;box-shadow:0 -4px 16px rgba(0,0,0,0.3);}' +
    '#devconsole-suggest.show{display:block;}' +
    '#devconsole-suggest .s-item{padding:4px 8px;cursor:pointer;color:rgba(255,255,255,0.5);font-size:10px;border-bottom:1px solid rgba(255,255,255,0.03);transition:all 0.1s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '#devconsole-suggest .s-item:last-child{border-bottom:none;}' +
    '#devconsole-suggest .s-item:hover,#devconsole-suggest .s-item.hover{background:rgba(79,195,247,0.08);color:#4fc3f7;}' +
    '#devconsole-suggest .s-item .s-desc{color:rgba(255,255,255,0.2);font-size:9px;margin-left:6px;}' +
    '#devconsole-btn{position:fixed;bottom:10px;right:10px;width:36px;height:36px;border-radius:8px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08);color:#666;font-size:14px;cursor:pointer;z-index:251;display:none;align-items:center;justify-content:center;transition:all 0.2s;font-family:monospace;}' +
    '#devconsole-btn:hover{background:rgba(255,255,255,0.08);color:#aaa;border-color:rgba(255,255,255,0.15);}' +
    '#devconsole-btn.open{color:#4fc3f7;border-color:rgba(79,195,247,0.3);}' +
    '#devconsole-badge{position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:#ef5350;color:#fff;font-size:8px;display:flex;align-items:center;justify-content:center;display:none;}',

  _logs: [],
  _maxLogs: 200,
  _console: null,
  _btn: null,
  _body: null,
  _input: null,
  _badge: null,
  _menuVisible: true,
  _errorCount: 0,
  _originalLog: null,
  _originalWarn: null,
  _originalError: null,
  _history: [],
  _historyIdx: -1,

  init(game) {
    var self = this;

    var consoleEl = document.createElement('div');
    consoleEl.id = 'devconsole';
    consoleEl.innerHTML =
      '<div id="devconsole-header">' +
        '<span>KONSOL</span>' +
        '<button id="devconsole-clear">×</button>' +
      '</div>' +
      '<div id="devconsole-body"></div>' +
      '<div id="devconsole-input-area">' +
        '<div id="devconsole-suggest"></div>' +
        '<input id="devconsole-input" type="text" placeholder="komut yaz..." spellcheck="false">' +
      '</div>';
    document.body.appendChild(consoleEl);
    this._console = consoleEl;
    this._body = document.getElementById('devconsole-body');
    this._input = document.getElementById('devconsole-input');
    this._suggest = document.getElementById('devconsole-suggest');

    // Drag
    var header = document.getElementById('devconsole-header');
    function startDrag(cx, cy) {
      var rect = consoleEl.getBoundingClientRect();
      isDragging = true;
      dragOffX = cx - rect.left;
      dragOffY = cy - rect.top;
    }
    function moveDrag(cx, cy) {
      if (!isDragging) return;
      consoleEl.style.left = (cx - dragOffX) + 'px';
      consoleEl.style.top = (cy - dragOffY) + 'px';
      consoleEl.style.right = 'auto';
      consoleEl.style.bottom = 'auto';
    }
    function endDrag() { isDragging = false; }
    var isDragging = false, dragOffX = 0, dragOffY = 0;
    if (header) {
      header.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'BUTTON') return;
        startDrag(e.clientX, e.clientY);
      });
      header.addEventListener('touchstart', function(e) {
        var t = e.touches[0];
        startDrag(t.clientX, t.clientY);
      }, { passive: false });
    }
    document.addEventListener('mousemove', function(e) { moveDrag(e.clientX, e.clientY); });
    document.addEventListener('touchmove', function(e) {
      if (isDragging) e.preventDefault();
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    // Input
    this._suggestIdx = -1;
    this._input.addEventListener('input', function() {
      self._updateSuggestions();
    });
    this._input.addEventListener('keydown', function(e) {
      var sug = self._suggest;
      var items = sug ? sug.querySelectorAll('.s-item') : [];
      if (e.key === 'Tab' || e.key === 'Enter') {
        if (e.key === 'Tab' && items.length > 0) {
          e.preventDefault();
          self._applySuggestion(items[0]);
          return;
        }
        if (e.key !== 'Enter') return;
        var val = self._input.value.trim();
        if (!val) return;
        self._hideSuggest();
        self._history.push(val);
        self._historyIdx = self._history.length;
        self._input.value = '';
        self._addLog('cmd', '> ' + val);
        var result = PluginCommandsAPI.execute(val);
        if (result.output) {
          self._addLog(result.success ? 'output' : 'error', result.output);
        }
        self._scrollBottom();
      } else if (e.key === 'ArrowUp') {
        if (items.length > 0 && sug.classList.contains('show')) {
          e.preventDefault();
          self._suggestIdx = Math.max(0, self._suggestIdx - 1);
          self._highlightSuggest(items);
          return;
        }
        if (self._historyIdx > 0) {
          self._historyIdx--;
          self._input.value = self._history[self._historyIdx];
          self._updateSuggestions();
        }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (items.length > 0 && sug.classList.contains('show')) {
          e.preventDefault();
          self._suggestIdx = Math.min(items.length - 1, self._suggestIdx + 1);
          self._highlightSuggest(items);
          return;
        }
        if (self._historyIdx < self._history.length - 1) {
          self._historyIdx++;
          self._input.value = self._history[self._historyIdx];
          self._updateSuggestions();
        } else {
          self._historyIdx = self._history.length;
          self._input.value = '';
          self._updateSuggestions();
        }
        e.preventDefault();
      }
    });

    // Toggle button
    var btn = document.createElement('div');
    btn.id = 'devconsole-btn';
    btn.title = 'Konsolu Aç/Kapat';
    btn.textContent = '>_';
    var badge = document.createElement('div');
    badge.id = 'devconsole-badge';
    badge.textContent = '0';
    btn.appendChild(badge);
    document.body.appendChild(btn);
    this._btn = btn;
    this._badge = badge;
    this._errorCount = 0;

    btn.addEventListener('click', function() {
      var isOpen = consoleEl.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      if (isOpen) {
        self._clearBadge();
        setTimeout(function() { self._input.focus(); }, 50);
      }
    });

    document.getElementById('devconsole-clear').addEventListener('click', function() {
      self._body.innerHTML = '';
      self._logs = [];
      self._clearBadge();
    });

    // Visibility
    this._menuVisible = true;
    this._updateButtonVisibility();

    PluginRegistry.on('game:start', this.id, function() {
      self._menuVisible = false;
      self._updateButtonVisibility();
    });
    PluginRegistry.on('game:over', this.id, function() {
      self._menuVisible = true;
      self._updateButtonVisibility();
    });
    PluginRegistry.on('intro:done', this.id, function() {
      self._menuVisible = true;
      self._updateButtonVisibility();
    });

    // console.log/warn/error capture
    this._originalLog = console.log;
    console.log = function() {
      var args = [];
      for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
      self._addLog('info', args.join(' '));
      self._originalLog.apply(console, args);
    };
    this._originalWarn = console.warn;
    console.warn = function() {
      var args = [];
      for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
      self._addLog('warn', args.join(' '));
      self._originalWarn.apply(console, args);
    };
    this._originalError = console.error;
    console.error = function() {
      var args = [];
      for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
      self._addLog('error', args.join(' '));
      self._originalError.apply(console, args);
    };

    // Register built-in commands
    this._registerCommands();
    this.log('Geliştirici Konsolu aktif');
  },

  _registerCommands() {
    var self = this;

    PluginCommandsAPI.register('ui_devconsole', 'help', function(args) {
      var cmds = PluginCommandsAPI.getAll();
      var out = 'Kullanılabilir komutlar:\n';
      cmds.forEach(function(c) {
        out += '  ' + c.commandName + '  — ' + c.description + '\n';
      });
      return out;
    }, 'Komut listesini göster');

    PluginCommandsAPI.register('ui_devconsole', 'clear', function(args) {
      self._body.innerHTML = '';
      self._logs = [];
      return '';
    }, 'Konsolu temizle');

    PluginCommandsAPI.register('ui_devconsole', 'plugins', function(args) {
      if (args.length === 0) return 'Kullanım: plugins list / plugins get <id> / plugins pause <id> / plugins resume <id>';
      var sub = args[0];
      if (sub === 'list') {
        var all = PluginRegistry.getAll();
        var out = 'ID'.padEnd(22) + 'İsim'.padEnd(14) + 'Durum'.padEnd(8) + 'Sürüm\n';
        out += '─'.repeat(52) + '\n';
        all.forEach(function(p) {
          var id = (p.id || '').substring(0, 20).padEnd(22);
          var name = (p.name || '').substring(0, 12).padEnd(14);
          var status = (p._crashed ? 'Hata' : p.enabled ? 'Aktif' : 'Pasif').padEnd(8);
          var ver = p.version || '1.0';
          out += id + name + status + ver + '\n';
        });
        return out;
      } else if (sub === 'get') {
        if (!args[1]) return 'Kullanım: plugins get <id>';
        var p = PluginRegistry.getAll().filter(function(x) { return x.id === args[1]; })[0];
        if (!p) return 'Plugin bulunamadı: ' + args[1];
        var durum = p._crashed ? 'Hata' : p.enabled ? 'Aktif' : 'Pasif';
        return 'İsim: ' + (p.name || p.id) + '\nDosya: ' + (p._iniPath ? p._iniPath.split('/').pop() : '-') + '\nDurum: ' + durum + '\nSürüm: ' + (p.version || '1.0') + '\nTip: ' + (p.type || '-') + '\nYazar: ' + (p.author || '-');
      } else if (sub === 'pause' && args[1]) {
        var p = PluginRegistry.getAll().filter(function(x) { return x.id === args[1]; })[0];
        if (!p) return 'Plugin bulunamadı: ' + args[1];
        if (!p.enabled) return args[1] + ' zaten pasif';
        PluginRegistry.disable(args[1]);
        return args[1] + ' pasifleştirildi';
      } else if (sub === 'resume' && args[1]) {
        var p = PluginRegistry.getAll().filter(function(x) { return x.id === args[1]; })[0];
        if (!p) return 'Plugin bulunamadı: ' + args[1];
        if (p.enabled) return args[1] + ' zaten aktif';
        PluginRegistry.enable(args[1]);
        return args[1] + ' aktifleştirildi';
      }
      return 'Bilinmeyen alt komut: ' + sub;
    }, 'Plugin yönetimi: list / get / pause / resume');
  },

  _hideSuggest() {
    if (this._suggest) this._suggest.classList.remove('show');
    this._suggestIdx = -1;
  },

  _highlightSuggest(items) {
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('hover', i === this._suggestIdx);
    }
  },

  _updateSuggestions() {
    var val = this._input.value.trim();
    var sug = this._suggest;
    if (!sug) return;

    if (!val) { this._hideSuggest(); return; }

    var cmds = PluginCommandsAPI.getAll();
    var matches = [];
    var lowerVal = val.toLowerCase();

    // Kısaltılmış isimler — çakışma varsa pluginId:commandName eklenir
    var nameCount = {};
    cmds.forEach(function(c) { nameCount[c.commandName] = (nameCount[c.commandName] || 0) + 1; });

    cmds.forEach(function(c) {
      var keys = [c.commandName];
      if (nameCount[c.commandName] > 1) keys.push(c.pluginId + ':' + c.commandName);
      keys.forEach(function(k) {
        if (k.toLowerCase().indexOf(lowerVal) === 0 || k.toLowerCase().indexOf(lowerVal) > 0) {
          matches.push({ key: k, cmd: c, score: k.toLowerCase().indexOf(lowerVal) });
        }
      });
    });

    // Deduplicate by key
    var seen = {};
    matches = matches.filter(function(m) {
      if (seen[m.key]) return false;
      seen[m.key] = true;
      return true;
    });

    // Sort: exact prefix first, then by score, then alphabetically
    matches.sort(function(a, b) {
      var aPref = a.key.toLowerCase().indexOf(lowerVal) === 0 ? 0 : 1;
      var bPref = b.key.toLowerCase().indexOf(lowerVal) === 0 ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
      if (a.score !== b.score) return a.score - b.score;
      return a.key.localeCompare(b.key);
    });

    // If exact match, hide
    if (matches.length === 1 && matches[0].key.toLowerCase() === lowerVal) {
      this._hideSuggest();
      return;
    }

    var maxShow = 5;
    var show = matches.slice(0, maxShow);
    sug.innerHTML = '';
    var self = this;

    show.forEach(function(m) {
      var item = document.createElement('div');
      item.className = 's-item';
      item.dataset.key = m.key;
      var idx = m.key.toLowerCase().indexOf(lowerVal);
      var prefix = m.key.substring(0, idx);
      var match = m.key.substring(idx, idx + lowerVal.length);
      var suffix = m.key.substring(idx + lowerVal.length);
      var displayKey = prefix + '<b style="color:#4fc3f7;font-weight:600;">' + match + '</b>' + suffix;
      item.innerHTML = displayKey + '<span class="s-desc">' + (m.cmd.description || '') + '</span>';
      item.addEventListener('click', function() {
        self._applySuggestion(this);
      });
      item.addEventListener('mouseenter', function() {
        var all = sug.querySelectorAll('.s-item');
        for (var i = 0; i < all.length; i++) all[i].classList.remove('hover');
        this.classList.add('hover');
      });
      sug.appendChild(item);
    });

    this._suggestIdx = -1;
    sug.classList.add('show');
  },

  _applySuggestion(item) {
    if (!item) return;
    var key = item.dataset.key || '';
    this._input.value = key + ' ';
    this._hideSuggest();
    this._input.focus();
  },

  _updateButtonVisibility() {
    if (this._btn) {
      this._btn.style.display = this._menuVisible ? 'flex' : 'none';
    }
  },

  _clearBadge() {
    this._errorCount = 0;
    this._badge.style.display = 'none';
  },

  _addLog(type, msg) {
    this._logs.push({ type: type, msg: msg, time: Date.now() });
    if (this._logs.length > this._maxLogs) this._logs.shift();

    if (type === 'error' && !this._console.classList.contains('open')) {
      this._errorCount++;
      this._badge.textContent = this._errorCount;
      this._badge.style.display = 'flex';
    }

    var div = document.createElement('div');
    div.className = 'log-' + type;
    div.textContent = msg;
    this._body.appendChild(div);
    if (this._body.children.length > this._maxLogs) {
      this._body.removeChild(this._body.firstChild);
    }

    if (this._console.classList.contains('open')) {
      this._scrollBottom();
    }
  },

  _scrollBottom() {
    this._body.scrollTop = this._body.scrollHeight;
  },

  destroy() {
    PluginCommandsAPI.unregisterAll('ui_devconsole');
    if (this._originalLog) console.log = this._originalLog;
    if (this._originalWarn) console.warn = this._originalWarn;
    if (this._originalError) console.error = this._originalError;
    var el = document.getElementById('devconsole');
    if (el) el.remove();
    var btn = document.getElementById('devconsole-btn');
    if (btn) btn.remove();
    PluginRegistry.off('game:start', this.id);
    PluginRegistry.off('game:over', this.id);
    PluginRegistry.off('intro:done', this.id);
    PluginRegistry.removeStyles(this.id);
  }
});
