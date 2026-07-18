window.PluginLoader = (function() {

  var _entries = [];    // { name, path, debug }
  var _loaded = {};
  var _errors = {};
  var _pendingErrors = [];
  var _cacheBust = Date.now();
  var _loadingPaths = {};
  var _globalErrorHandler = null;
  var _activeResults = null;
  var _nameToPath = {};
  var _scanDone = false;

  var _subdirs = ['core', 'fx', 'input', 'models', 'ui', 'weapons', 'entities', 'pickups', 'menu', 'misc', 'maps'];

  function _calcDisplayTime(bytes) {
    if (bytes <= 0) return 80;
    var ms = bytes / 50;
    return Math.max(30, Math.min(ms, 500));
  }

  function _ensureErrorTracking() {
    if (_globalErrorHandler) return;
    _globalErrorHandler = function(event) {
      var src = event.filename || '';
      var path = '';
      for (var k in _loadingPaths) {
        if (src.indexOf(k) !== -1) { path = k; break; }
      }
      if (!path) return;
      delete _loadingPaths[path];
      var errMsg = event.message || (event.error && event.error.message) || 'Bilinmeyen hata';
      var errStack = (event.error && event.error.stack) || '';
      if (_errors[path]) return;
      _errors[path] = { message: errMsg, stack: errStack };
      _pendingErrors.push({ path: path, message: errMsg, stack: errStack });
      if (_activeResults) _activeResults.errors.push(path);
    };
    window.addEventListener('error', _globalErrorHandler);
  }

  // ---------- Klasör tara, .js dosyalarını bul ----------
  function _scanDir(dir, onDone) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', dir + '/?v=' + _cacheBust, true);
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        var html = xhr.responseText;
        var base = dir.replace(/\/+$/, '') + '/';
        var regex = /<a[^>]+href="([^"]+\.js)"/gi;
        var match;
        while ((match = regex.exec(html)) !== null) {
          var fname = decodeURIComponent(match[1]);
          var name = fname.replace(/\.js$/i, '');
          if (!_nameToPath[name]) {
            _nameToPath[name] = base + fname;
          }
        }
      }
      if (onDone) onDone();
    };
    xhr.onerror = function() { if (onDone) onDone(); };
    xhr.send();
  }

  function _scanPlugins(onDone) {
    if (_scanDone) { if (onDone) onDone(); return; }
    _nameToPath = {};
    var pending = _subdirs.length + 1;
    _subdirs.forEach(function(sub) {
      _scanDir('js/plugins/' + sub, function() {
        pending--;
        if (pending <= 0) { _scanDone = true; if (onDone) onDone(); }
      });
    });
    _scanDir('js/plugins/maps/models', function() {
      pending--;
      if (pending <= 0) { _scanDone = true; if (onDone) onDone(); }
    });
  }

  // ---------- İsimden yolu çöz ----------
  function _resolvePath(name) {
    if (_nameToPath[name]) return _nameToPath[name];
    if (_nameToPath[name.replace(/\.js$/i, '')]) return _nameToPath[name.replace(/\.js$/i, '')];
    if (name.indexOf('/') !== -1) return name;
    return null;
  }

  // ---------- plugins.ini oku ----------
  function loadIni(url, onDone) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url + '?v=' + _cacheBust, true);
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        var lines = xhr.responseText.split('\n');
        lines.forEach(function(line) {
          line = line.trim();
          if (line === '' || line.startsWith('#') || line.startsWith('//')) return;
          var parts = line.split(/\s+/);
          var name = parts[0];
          var flags = parts.slice(1);
          _entries.push({
            name: name,
            path: null,
            debug: flags.indexOf('debug') !== -1
          });
        });
        _scanPlugins(function() {
          if (onDone) onDone(null, _entries);
        });
      } else {
        if (onDone) onDone('INI yuklenemedi: ' + xhr.status);
      }
    };
    xhr.onerror = function() { if (onDone) onDone('INI dosyasina erisilemedi'); };
    xhr.send();
  }

  // ---------- Tüm pluginleri yükle ----------
  function _doLoad(entries, idx, results, onComplete, onProgress) {
    if (idx >= entries.length) {
      _activeResults = null;
      if (onComplete) onComplete(results);
      return;
    }

    var entry = entries[idx];
    var path = _resolvePath(entry.name);
    if (!path) {
      _errors[entry.name] = true;
      results.errors.push(entry.name);
      _pendingErrors.push({ path: entry.name, message: 'Plugin bulunamadi: ' + entry.name, stack: '' });
      _doLoad(entries, idx + 1, results, onComplete, onProgress);
      return;
    }

    entry.path = path;

    var sizeXhr = new XMLHttpRequest();
    sizeXhr.open('HEAD', path + '?v=' + _cacheBust, true);
    sizeXhr.onload = function() {
      var bytes = parseInt(sizeXhr.getResponseHeader('Content-Length')) || 0;
      var displayTime = _calcDisplayTime(bytes);
      _loadPlugin(entries, idx, path, entry, displayTime, results, onComplete, onProgress);
    };
    sizeXhr.onerror = function() {
      _loadPlugin(entries, idx, path, entry, 80, results, onComplete, onProgress);
    };
    sizeXhr.send();
  }

  function _loadPlugin(entries, idx, path, entry, displayTime, results, onComplete, onProgress) {
    _loadingPaths[path] = true;

    var script = document.createElement('script');
    script.src = path + '?v=' + _cacheBust;
    script.async = false;
    script.setAttribute('data-ini-path', path);
    if (entry.debug) script.setAttribute('data-debug', 'true');

    var pluginInfo = null;

    script.onload = function() {
      delete _loadingPaths[path];
      _loaded[path] = true;
      results.loaded.push(path);

      try { pluginInfo = PluginRegistry.get(entry.name); } catch (e) {}

      if (onProgress) {
        onProgress(idx + 1, entries.length, path, pluginInfo, displayTime);
      }

      setTimeout(function() {
        _doLoad(entries, idx + 1, results, onComplete, onProgress);
      }, displayTime);
    };

    script.onerror = function() {
      delete _loadingPaths[path];
      _errors[path] = true;
      results.errors.push(path);
      _pendingErrors.push({ path: path, message: 'Dosya yuklenemedi (404/network)', stack: '' });
      if (onProgress) onProgress(idx + 1, entries.length, path, null, 0);
      setTimeout(function() {
        _doLoad(entries, idx + 1, results, onComplete, onProgress);
      }, 60);
    };

    document.body.appendChild(script);
  }

  function loadAll(onComplete, onProgress) {
    var total = _entries.length;
    if (total === 0) {
      if (onComplete) onComplete({ loaded: [], errors: [] });
      return;
    }

    var results = { loaded: [], errors: [] };
    _activeResults = results;
    _ensureErrorTracking();

    _doLoad(_entries, 0, results, onComplete, onProgress);
  }

  // ---------- Tek script yükle (loadScript ile cagrilan sub-plugin'lar) ----------
  var _subQueue = [];
  var _subActive = 0;
  var _subDone = 0;
  var _subTotal = 0;
  var _subCallback = null;
  var _subProcessing = false;

  function setSubProgressCallback(cb) { _subCallback = cb; }

  function hasPendingLoads() { return _subActive > 0 || _subQueue.length > 0; }
  function hadSubLoads() { return _subTotal > 0; }

  function _subComplete(isError, path) {
    _subActive--;
    _subDone++;
    if (_subCallback) _subCallback(_subDone, _subTotal, path, isError ? 'HATA' : null);
  }

  function _processSubQueue() {
    if (_subQueue.length === 0) {
      _subProcessing = false;
      return;
    }
    _subProcessing = true;

    var job = _subQueue.shift();
    _subActive++;

    setTimeout(function() {

      _ensureErrorTracking();
      _loadingPaths[job.path] = true;

      var script = document.createElement('script');
      script.src = job.path + '?v=' + _cacheBust;
      script.async = false;
      script.setAttribute('data-ini-path', job.path);

      script.onload = function() {
        delete _loadingPaths[job.path];
        _loaded[job.path] = true;
        _subComplete(false, job.path);
        if (job.callback) job.callback(null, job.path);
        _processSubQueue();
      };

      script.onerror = function() {
        delete _loadingPaths[job.path];
        _errors[job.path] = true;
        _pendingErrors.push({ path: job.path, message: 'Dosya yuklenemedi (404/network)', stack: '' });
        _subComplete(true, job.path);
        if (job.callback) job.callback('Yuklenemedi: ' + job.path, job.path);
        _processSubQueue();
      };

      document.body.appendChild(script);
    }, 120);
  }

  function loadScript(name, callback) {
    var path;
    if (name.indexOf('/') !== -1) {
      path = name;
    } else {
      var bare = name.replace(/\.js$/i, '');
      path = _resolvePath(bare) || _nameToPath[bare] || 'js/plugins/models/' + bare + '.js';
    }
    if (_loaded[path]) { if (callback) callback(null, path); return; }
    _subTotal++;
    _subQueue.push({ path: path, callback: callback });
  }

  function startSubQueue() {
    if (!_subProcessing) _processSubQueue();
  }

  function isLoaded(path) { return !!_loaded[path]; }
  function getErrors() { return Object.keys(_errors); }
  function getPendingErrors() { var e = _pendingErrors.slice(); _pendingErrors.length = 0; return e; }
  function getEntries() { return _entries.slice(); }

  function reset() {
    _entries.length = 0;
    Object.keys(_loaded).forEach(function(k) { delete _loaded[k]; });
    Object.keys(_errors).forEach(function(k) { delete _errors[k]; });
    Object.keys(_loadingPaths).forEach(function(k) { delete _loadingPaths[k]; });
    _pendingErrors.length = 0;
    _subQueue.length = 0;
    _subActive = 0;
    _subDone = 0;
    _subTotal = 0;
    _subProcessing = false;
    _subCallback = null;
  }

  return {
    loadIni: loadIni,
    loadAll: loadAll,
    loadScript: loadScript,
    isLoaded: isLoaded,
    getErrors: getErrors,
    getPendingErrors: getPendingErrors,
    getEntries: getEntries,
    setSubProgressCallback: setSubProgressCallback,
    hasPendingLoads: hasPendingLoads,
    hadSubLoads: hadSubLoads,
    startSubQueue: startSubQueue,
    reset: reset
  };
})();
