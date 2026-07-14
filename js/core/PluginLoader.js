window.PluginLoader = (function() {

  var _entries = [];    // { path, debug }
  var _loaded = {};
  var _errors = {};
  var _pendingErrors = [];

  // ---------- plugins.ini dosyasını oku ----------
  function loadIni(url, onDone) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        var lines = xhr.responseText.split('\n');
        lines.forEach(function(line) {
          line = line.trim();
          if (line === '' || line.startsWith('#') || line.startsWith('//')) return;

          // Format: js/plugins/foo.js [flag1] [flag2] ...
          var parts = line.split(/\s+/);
          var path = parts[0];
          var flags = parts.slice(1);

          _entries.push({
            path: path,
            debug: flags.indexOf('debug') !== -1
          });
        });
        if (onDone) onDone(null, _entries);
      } else {
        if (onDone) onDone('INI yüklenemedi: ' + xhr.status);
      }
    };
    xhr.onerror = function() {
      if (onDone) onDone('INI dosyasına erişilemedi');
    };
    xhr.send();
  }

  // ---------- Tüm pluginleri yükle (progress callback'li) ----------
  function loadAll(onComplete, onProgress) {
    var total = _entries.length;
    if (total === 0) {
      if (onComplete) onComplete({ loaded: [], errors: [] });
      return;
    }

    var done = 0;
    var results = { loaded: [], errors: [] };
    var loadingPaths = {};

    // Script yürütme hatası yakalama — script onload çalışsa bile JS hatası olursa göster
    function _onScriptError(event) {
      var src = event.filename || '';
      var path = '';
      for (var k in loadingPaths) {
        if (src.indexOf(k) !== -1) { path = k; break; }
      }
      if (!path) return;
      delete loadingPaths[path];
      var errMsg = event.message || (event.error && event.error.message) || 'Bilinmeyen hata';
      var errStack = (event.error && event.error.stack) || '';
      console.error('[PluginLoader] Hata:', path, errMsg);
      console.error(event.error || event.message);
      if (_errors[path]) return;
      _errors[path] = { message: errMsg, stack: errStack };
      results.errors.push(path);
      _pendingErrors.push({ path: path, message: errMsg, stack: errStack });
    }
    window.addEventListener('error', _onScriptError);

    _entries.forEach(function(entry, idx) {
      loadingPaths[entry.path] = true;

      var script = document.createElement('script');
      script.src = entry.path;
      script.async = false;

      // InI yolunu script elementine ata — PluginRegistry.register() okusun
      script.setAttribute('data-ini-path', entry.path);

      // Debug flag'i script elementine ata — PluginRegistry.register() okusun
      if (entry.debug) {
        script.setAttribute('data-debug', 'true');
      }

      script.onload = function() {
        _loaded[entry.path] = true;
        results.loaded.push(entry.path);
        if (onProgress) onProgress(done + 1, total, entry.path);
        done++;
        if (done >= total) {
          window.removeEventListener('error', _onScriptError);
          if (onComplete) onComplete(results);
        }
      };

      script.onerror = function() {
        delete loadingPaths[entry.path];
        _errors[entry.path] = true;
        results.errors.push(entry.path);
        console.error('[PluginLoader] Yüklenemedi:', entry.path);
        if (onProgress) onProgress(done + 1, total, entry.path);
        done++;
        if (done >= total) {
          window.removeEventListener('error', _onScriptError);
          if (onComplete) onComplete(results);
        }
      };

      document.body.appendChild(script);
    });
  }

  // ---------- Durum sorgulama ----------
  function isLoaded(path) { return !!_loaded[path]; }
  function getErrors() { return Object.keys(_errors); }
  function getPendingErrors() { var e = _pendingErrors.slice(); _pendingErrors.length = 0; return e; }
  function getEntries() { return _entries.slice(); }

  function reset() {
    _entries.length = 0;
    Object.keys(_loaded).forEach(function(k) { delete _loaded[k]; });
    Object.keys(_errors).forEach(function(k) { delete _errors[k]; });
  }

  return {
    loadIni: loadIni,
    loadAll: loadAll,
    isLoaded: isLoaded,
    getErrors: getErrors,
    getPendingErrors: getPendingErrors,
    getEntries: getEntries,
    reset: reset
  };
})();
