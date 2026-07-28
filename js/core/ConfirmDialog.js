window.ConfirmDialog = {
  _overlay: null,
  _active: false,
  _callback: null,
  _resolve: null,

  show: function(opts, callback) {
    var self = this;
    if (this._active) return;
    this._active = true;

    var isPromise = typeof callback !== 'function';
    this._callback = isPromise ? null : callback;

    var title = opts.title || 'Onay';
    var subText = opts.subText || '';
    var buttons = opts.buttons || [{ label: 'Tamam', value: true, primary: true }];
    var blurPx = opts.blur != null ? opts.blur : 8;

    var overlay = document.createElement('div');
    overlay.id = 'cdOverlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99998;' +
      'background:rgba(0,0,0,0.55);' +
      '-webkit-backdrop-filter:blur(' + blurPx + 'px);backdrop-filter:blur(' + blurPx + 'px);' +
      'display:flex;align-items:center;justify-content:center;' +
      'opacity:0;transition:opacity .25s ease;';

    var box = document.createElement('div');
    box.id = 'cdBox';
    box.style.cssText =
      'background:#12121e;border:1px solid rgba(255,255,255,0.06);border-radius:16px;' +
      'padding:clamp(24px,3vw,40px);max-width:440px;width:90%;' +
      'box-shadow:0 24px 80px rgba(0,0,0,0.5);' +
      'transform:translateY(16px) scale(0.97);transition:transform .3s cubic-bezier(.22,1,.36,1);';

    if (title) {
      var titleEl = document.createElement('div');
      titleEl.id = 'cdTitle';
      titleEl.textContent = title;
      titleEl.style.cssText =
        'font-size:clamp(18px,2vw,22px);font-weight:700;color:#fff;' +
        'letter-spacing:.5px;margin-bottom:' + (subText ? '8px' : '20px') + ';';
      box.appendChild(titleEl);
    }

    if (subText) {
      var subEl = document.createElement('div');
      subEl.id = 'cdSub';
      subEl.textContent = subText;
      subEl.style.cssText =
        'font-size:clamp(13px,1.3vw,14px);color:rgba(255,255,255,0.4);' +
        'line-height:1.5;margin-bottom:clamp(20px,2.5vw,28px);';
      box.appendChild(subEl);
    }

    var btnRow = document.createElement('div');
    btnRow.id = 'cdButtons';
    btnRow.style.cssText =
      'display:flex;gap:10px;justify-content:flex-end;margin-top:' + (title || subText ? '0' : '0') + ';';

    buttons.forEach(function(btn, idx) {
      var el = document.createElement('button');
      el.textContent = btn.label;
      el.dataset.value = btn.value;
      if (btn.primary) {
        el.style.cssText =
          'background:#c62828;border:none;color:#fff;font-family:inherit;' +
          'font-size:clamp(13px,1.3vw,14px);letter-spacing:1px;text-transform:uppercase;' +
          'padding:10px 24px;border-radius:8px;cursor:pointer;transition:all .2s;font-weight:600;';
        el.onmouseover = function() { this.style.background = '#b71c1c'; this.style.transform = 'scale(1.03)'; };
        el.onmouseout = function() { this.style.background = '#c62828'; this.style.transform = ''; };
        el.onmousedown = function() { this.style.transform = 'scale(.97)'; };
        el.onmouseup = function() { this.style.transform = 'scale(1.03)'; };
      } else {
        el.style.cssText =
          'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);font-family:inherit;' +
          'font-size:clamp(13px,1.3vw,14px);letter-spacing:1px;text-transform:uppercase;' +
          'padding:10px 24px;border-radius:8px;cursor:pointer;transition:all .2s;';
        el.onmouseover = function() { this.style.background = 'rgba(255,255,255,0.08)'; this.style.color = '#fff'; };
        el.onmouseout = function() { this.style.background = 'rgba(255,255,255,0.04)'; this.style.color = 'rgba(255,255,255,0.5)'; };
      }
      el.onclick = function(e) {
        e.stopPropagation();
        self._close(btn.value);
      };
      btnRow.appendChild(el);
    });

    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    this._overlay = overlay;

    overlay.onclick = function() {
      var cancelBtn = buttons.find(function(b) { return !b.primary; });
      self._close(cancelBtn ? cancelBtn.value : null);
    };
    box.onclick = function(e) { e.stopPropagation(); };

    this._keyHandler = function(e) {
      if (e.key === 'Escape') {
        var cancelBtn = buttons.find(function(b) { return !b.primary; });
        self._close(cancelBtn ? cancelBtn.value : null);
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    requestAnimationFrame(function() {
      overlay.style.opacity = '1';
      box.style.transform = 'translateY(0) scale(1)';
    });

    if (isPromise) {
      var p = new Promise(function(resolve) { self._callback = resolve; });
      return p;
    }
    return this;
  },

  _close: function(value) {
    if (!this._active) return;
    this._active = false;

    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }

    var cb = this._callback;
    var overlay = this._overlay;
    var box = overlay && overlay.querySelector('#cdBox');

    if (box) box.style.transform = 'translateY(8px) scale(.97)';
    if (overlay) overlay.style.opacity = '0';

    var self = this;
    setTimeout(function() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      self._overlay = null;
      self._callback = null;
      if (cb) cb(value);
    }, 250);
  }
};

Engine.register('ConfirmDialog', { name: 'Onay Diyalogu', type: 'core', version: '1.0', description: 'Kullanici onay penceresi API' });
