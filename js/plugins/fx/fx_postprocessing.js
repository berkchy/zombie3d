var plugin = include('registry');
var cvar = include('cvar');
var commands = include('commands');

// ==================== FULLSCREEN QUAD ====================
function Fsq(mat) {
  var geo = new THREE.PlaneGeometry(2, 2);
  var mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 999;
  return mesh;
}

// ==================== SHADER DEFS ====================
var brightVert = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
var brightFrag = 'uniform sampler2D tDiffuse;uniform float threshold;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float b=c.r*0.299+c.g*0.587+c.b*0.114;float s=smoothstep(threshold,threshold+0.4,b);gl_FragColor=vec4(c.rgb*s,c.a);}';

var blurFragH = 'uniform sampler2D tDiffuse;uniform vec2 resolution;varying vec2 vUv;void main(){vec2 px=vec2(1.0/resolution.x,0.0);vec4 c=texture2D(tDiffuse,vUv)*0.227;c+=texture2D(tDiffuse,vUv+px*1.0)*0.158;c+=texture2D(tDiffuse,vUv-px*1.0)*0.158;c+=texture2D(tDiffuse,vUv+px*2.0)*0.073;c+=texture2D(tDiffuse,vUv-px*2.0)*0.073;c+=texture2D(tDiffuse,vUv+px*3.0)*0.018;c+=texture2D(tDiffuse,vUv-px*3.0)*0.018;gl_FragColor=c;}';
var blurFragV = 'uniform sampler2D tDiffuse;uniform vec2 resolution;varying vec2 vUv;void main(){vec2 px=vec2(0.0,1.0/resolution.y);vec4 c=texture2D(tDiffuse,vUv)*0.227;c+=texture2D(tDiffuse,vUv+px*1.0)*0.158;c+=texture2D(tDiffuse,vUv-px*1.0)*0.158;c+=texture2D(tDiffuse,vUv+px*2.0)*0.073;c+=texture2D(tDiffuse,vUv-px*2.0)*0.073;c+=texture2D(tDiffuse,vUv+px*3.0)*0.018;c+=texture2D(tDiffuse,vUv-px*3.0)*0.018;gl_FragColor=c;}';

var combineFrag = 'uniform sampler2D tDiffuse;uniform sampler2D tBloom;uniform float bloomIntensity;uniform float vignetteAmount;uniform float saturation;uniform float contrast;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);vec4 b=texture2D(tBloom,vUv);c.rgb+=b.rgb*bloomIntensity;float l=dot(c.rgb,vec3(0.299,0.587,0.114));c.rgb=mix(vec3(l),c.rgb,saturation);c.rgb=(c.rgb-0.5)*contrast+0.5;float d=distance(vUv,vec2(0.5,0.5));float v=1.0-smoothstep(0.15,0.65,d)*vignetteAmount;gl_FragColor=vec4(c.rgb*v,c.a);}';

// ==================== PLUGIN ====================
plugin.register({
  id: 'gfx_postprocessing',
  name: 'Grafik Motoru',
  type: 'graphics',
  version: '1.0',
  description: 'Bloom + Vignette + Color Grade + Fog + Shadows',
  priority: 100,

  active: false,
  _scene: null,
  _camera: null,
  _renderer: null,
  _rt: null,
  _rt2: null,
  _rt3: null,
  _brightMat: null,
  _blurHMat: null,
  _blurVMat: null,
  _combineMat: null,
  _fsqBright: null,
  _fsqBlurH: null,
  _fsqBlurV: null,
  _fsqCombine: null,
  _width: 0,
  _height: 0,
  _ppCamera: null,

  init() {
    var self = this;

    // Cvarlar
    cvar.register('gfx_bloom', 1, 'Bloom efekti ac/kapa');
    cvar.register('gfx_bloom_intensity', 0.8, 'Bloom siddeti (0.0-2.0)');
    cvar.register('gfx_bloom_threshold', 0.2, 'Bloom esik degeri');
    cvar.register('gfx_vignette', 1, 'Vignette (kenar kararmasi)');
    cvar.register('gfx_vignette_amount', 0.35, 'Vignette miktari');
    cvar.register('gfx_saturation', 1.0, 'Renk doygunlugu');
    cvar.register('gfx_contrast', 1.0, 'Kontrast');
    cvar.register('gfx_fog', 1, 'Sis efekti');
    cvar.register('gfx_fog_density', 0.008, 'Sis yogunlugu');
    cvar.register('gfx_shadows', 0, 'Golge kalitesi 0=off 1=low 2=high');
    cvar.register('gfx_quality', 'medium', 'Grafik kalitesi low/medium/ultra');

    this.active = true;

    // Komut: gfx preset
    if (commands) {
      commands.register('gfx_postprocessing', 'gfx', function(args) {
        if (args.length === 0) return 'gfx low | gfx medium | gfx ultra';
        var p = args[0];
        if (p === 'low') { self._setPreset('low'); return 'Low kalite'; }
        if (p === 'medium') { self._setPreset('medium'); return 'Medium kalite'; }
        if (p === 'ultra') { self._setPreset('ultra'); return 'Ultra kalite'; }
        return 'Bilinmeyen: ' + p;
      });
    }

    // Dinamik gölge ayari icin light listener
    plugin.on('game:start', this.id, function() {
      self._updateShadows();
    });
  },

  _setPreset(p) {
    cvar.set('gfx_quality', p);
    if (p === 'low') {
      cvar.set('gfx_bloom', 0); cvar.set('gfx_vignette', 0);
      cvar.set('gfx_fog', 1); cvar.set('gfx_fog_density', 0.005);
      cvar.set('gfx_shadows', 0); cvar.set('gfx_bloom_intensity', 0.5);
    } else if (p === 'medium') {
      cvar.set('gfx_bloom', 1); cvar.set('gfx_vignette', 1);
      cvar.set('gfx_fog', 1); cvar.set('gfx_fog_density', 0.008);
      cvar.set('gfx_shadows', 1); cvar.set('gfx_bloom_intensity', 0.8);
    } else {
      cvar.set('gfx_bloom', 1); cvar.set('gfx_vignette', 1);
      cvar.set('gfx_fog', 1); cvar.set('gfx_fog_density', 0.012);
      cvar.set('gfx_shadows', 2); cvar.set('gfx_bloom_intensity', 1.2);
    }
  },

  _ensureRT(w, h) {
    if (this._width === w && this._height === h && this._rt) return;
    this._width = w; this._height = h;
    var opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.UnsignedByteType, depthBuffer: true };

    if (this._rt) this._rt.dispose();
    if (this._rt2) this._rt2.dispose();
    if (this._rt3) this._rt3.dispose();
    this._rt = new THREE.WebGLRenderTarget(w, h, opts);
    this._rt2 = new THREE.WebGLRenderTarget(w, h, opts);
    this._rt3 = new THREE.WebGLRenderTarget(w, h, opts);
  },

  _initShaders() {
    if (this._brightMat) return;

    this._brightMat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, threshold: { value: 0.2 } },
      vertexShader: brightVert, fragmentShader: brightFrag, depthWrite: false, depthTest: false
    });
    this._blurHMat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, resolution: { value: new THREE.Vector2(1, 1) } },
      vertexShader: brightVert, fragmentShader: blurFragH, depthWrite: false, depthTest: false
    });
    this._blurVMat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, resolution: { value: new THREE.Vector2(1, 1) } },
      vertexShader: brightVert, fragmentShader: blurFragV, depthWrite: false, depthTest: false
    });
    this._combineMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null }, tBloom: { value: null },
        bloomIntensity: { value: 0.8 }, vignetteAmount: { value: 0.35 },
        saturation: { value: 1.0 }, contrast: { value: 1.0 }
      },
      vertexShader: brightVert, fragmentShader: combineFrag, depthWrite: false, depthTest: false
    });

    this._fsqBright = new Fsq(this._brightMat);
    this._fsqBlurH = new Fsq(this._blurHMat);
    this._fsqBlurV = new Fsq(this._blurVMat);
    this._fsqCombine = new Fsq(this._combineMat);

    this._blurHMat.uniforms.resolution.value.set(this._width || 1, this._height || 1);
    this._blurVMat.uniforms.resolution.value.set(this._width || 1, this._height || 1);
  },

  _updateShadows() {
    var shadowQuality = cvar.get('gfx_shadows') || 0;
    if (!this._renderer) return;

    if (shadowQuality > 0) {
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type = shadowQuality > 1 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;

      // Ana directional light'a shadow ekle
      if (game && game.scene) {
        game.scene.traverse(function(m) {
          if (m.isDirectionalLight || m.isSpotLight) {
            m.castShadow = true;
            m.shadow.mapSize.width = shadowQuality > 1 ? 1024 : 512;
            m.shadow.mapSize.height = shadowQuality > 1 ? 1024 : 512;
            m.shadow.camera.near = 0.5;
            m.shadow.camera.far = 30;
            m.shadow.camera.left = -15;
            m.shadow.camera.right = 15;
            m.shadow.camera.top = 15;
            m.shadow.camera.bottom = -15;
          }
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
          }
        });
      }
    } else {
      if (this._renderer) this._renderer.shadowMap.enabled = false;
    }
  },

  render(renderer, scene, camera) {
    if (!scene || !camera) return;
    this._scene = scene;
    this._camera = camera;
    this._renderer = renderer;

    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;

    // PP icin ortho kamera
    if (!this._ppCamera) {
      this._ppCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    // Fog
    if (cvar.get('gfx_fog') && scene) {
      scene.fog = new THREE.FogExp2(0x111122, cvar.get('gfx_fog_density') || 0.008);
    } else if (scene) {
      scene.fog = null;
    }

    // Shadows
    this._updateShadows();

    // Bloom check
    var doBloom = cvar.get('gfx_bloom') && cvar.get('gfx_bloom_intensity') > 0.01;
    var doVignette = cvar.get('gfx_vignette');
    var doColor = Math.abs(cvar.get('gfx_saturation') - 1.0) > 0.01 || Math.abs(cvar.get('gfx_contrast') - 1.0) > 0.01;

    if (!doBloom && !doVignette && !doColor) {
      renderer.render(scene, camera);
      return;
    }

    // Init
    this._ensureRT(w, h);
    this._initShaders();
    this._brightMat.uniforms.threshold.value = cvar.get('gfx_bloom_threshold') || 0.2;
    this._blurHMat.uniforms.resolution.value.set(w, h);
    this._blurVMat.uniforms.resolution.value.set(w, h);
    this._combineMat.uniforms.bloomIntensity.value = cvar.get('gfx_bloom_intensity') || 0.8;
    this._combineMat.uniforms.vignetteAmount.value = doVignette ? (cvar.get('gfx_vignette_amount') || 0.35) : 0;
    this._combineMat.uniforms.saturation.value = cvar.get('gfx_saturation') || 1.0;
    this._combineMat.uniforms.contrast.value = cvar.get('gfx_contrast') || 1.0;

    // Pass 1: Render scene to RT
    renderer.setRenderTarget(this._rt);
    renderer.render(scene, camera);

    if (doBloom) {
      // Pass 2: Extract bright → RT2
      this._brightMat.uniforms.tDiffuse.value = this._rt.texture;
      renderer.setRenderTarget(this._rt2);
      renderer.render(this._fsqBright, this._ppCamera);

      // Pass 3: Blur H → RT3
      this._blurHMat.uniforms.tDiffuse.value = this._rt2.texture;
      renderer.setRenderTarget(this._rt3);
      renderer.render(this._fsqBlurH, this._ppCamera);

      // Pass 4: Blur V → RT2
      this._blurVMat.uniforms.tDiffuse.value = this._rt3.texture;
      renderer.setRenderTarget(this._rt2);
      renderer.render(this._fsqBlurV, this._ppCamera);

      this._combineMat.uniforms.tBloom.value = this._rt2.texture;
    } else {
      this._combineMat.uniforms.tBloom.value = this._rt.texture;
      this._combineMat.uniforms.bloomIntensity.value = 0;
    }

    // Pass 5: Combine → screen
    this._combineMat.uniforms.tDiffuse.value = this._rt.texture;
    renderer.setRenderTarget(null);
    renderer.render(this._fsqCombine, this._ppCamera);
  },

  destroy() {
    if (this._rt) this._rt.dispose();
    if (this._rt2) this._rt2.dispose();
    if (this._rt3) this._rt3.dispose();
    this._rt = this._rt2 = this._rt3 = null;
    plugin.off('game:start', this.id);
    if (commands) commands.unregister('gfx_postprocessing', 'gfx');
  }
});
