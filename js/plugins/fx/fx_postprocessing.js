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

var combineFrag = 'uniform sampler2D tDiffuse;uniform sampler2D tBloom;uniform sampler2D tGodRays;uniform float bloomIntensity;uniform float godRayIntensity;uniform float vignetteAmount;uniform float saturation;uniform float contrast;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);vec4 b=texture2D(tBloom,vUv);c.rgb+=b.rgb*bloomIntensity;vec4 g=texture2D(tGodRays,vUv);float lum=dot(c.rgb,vec3(0.299,0.587,0.114));float grMask=smoothstep(0.08,0.4,lum);c.rgb+=g.rgb*godRayIntensity*grMask;float l=dot(c.rgb,vec3(0.299,0.587,0.114));c.rgb=mix(vec3(l),c.rgb,saturation);c.rgb=(c.rgb-0.5)*contrast+0.5;float d=distance(vUv,vec2(0.5,0.5));float v=1.0-smoothstep(0.15,0.65,d)*vignetteAmount;gl_FragColor=vec4(c.rgb*v,c.a);}';

var godRaysFrag = 'uniform sampler2D tDiffuse;uniform vec2 sunPos;uniform float intensity;uniform float decay;uniform float weight;varying vec2 vUv;void main(){vec2 uv=vUv;vec2 dir=sunPos-uv;float dist=length(dir);if(dist<0.001||dist>1.4){gl_FragColor=vec4(0.0,0.0,0.0,1.0);return;}vec2 delta=dir/96.0;vec3 col=vec3(0.0);float atten=1.0;for(int i=0;i<96;i++){vec4 s=texture2D(tDiffuse,uv);float lum=dot(s.rgb,vec3(0.299,0.587,0.114));float bright=smoothstep(0.15,0.6,lum);col+=s.rgb*weight*atten*bright;uv+=delta;atten*=decay;if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)break;}gl_FragColor=vec4(col*intensity,1.0);}';

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
  _rt4: null,
  _brightMat: null,
  _blurHMat: null,
  _blurVMat: null,
  _combineMat: null,
  _godRaysMat: null,
  _fsqBright: null,
  _fsqBlurH: null,
  _fsqBlurV: null,
  _fsqCombine: null,
  _fsqGodRays: null,
  _width: 0,
  _height: 0,
  _ppCamera: null,
  _sunVec: new THREE.Vector3(),
  _sunUV: new THREE.Vector2(),

  init() {
    var self = this;

    // Cvarlar
    cvar.register('gfx_bloom', 1, 'number', 'Bloom efekti ac/kapa');
    cvar.register('gfx_bloom_intensity', 0.25, 'number', 'Bloom siddeti (0.0-2.0)');
    cvar.register('gfx_bloom_threshold', 0.6, 'number', 'Bloom esik degeri');
    cvar.register('gfx_vignette', 1, 'number', 'Vignette (kenar kararmasi)');
    cvar.register('gfx_vignette_amount', 0.35, 'number', 'Vignette miktari');
    cvar.register('gfx_saturation', 1.0, 'number', 'Renk doygunlugu');
    cvar.register('gfx_contrast', 1.0, 'number', 'Kontrast');
    cvar.register('gfx_fog', 1, 'number', 'Sis efekti');
    cvar.register('gfx_fog_density', 0.008, 'number', 'Sis yogunlugu');
    cvar.register('gfx_godrays', 1, 'number', 'God rays (gunes isini)');
    cvar.register('gfx_godrays_intensity', 1.0, 'number', 'God rays siddeti (0-2)');
    cvar.register('gfx_shadows', 0, 'number', 'Golge kalitesi 0=off 1=low 2=high');
    cvar.register('gfx_quality', 'medium', 'string', 'Grafik kalitesi low/medium/ultra');

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
      cvar.set('gfx_shadows', 0); cvar.set('gfx_bloom_intensity', 0.2);
      cvar.set('gfx_godrays', 0);
    } else if (p === 'medium') {
      cvar.set('gfx_bloom', 1); cvar.set('gfx_vignette', 1);
      cvar.set('gfx_fog', 1); cvar.set('gfx_fog_density', 0.008);
      cvar.set('gfx_shadows', 1); cvar.set('gfx_bloom_intensity', 0.25);
      cvar.set('gfx_godrays', 1); cvar.set('gfx_godrays_intensity', 0.8);
    } else {
      cvar.set('gfx_bloom', 1); cvar.set('gfx_vignette', 1);
      cvar.set('gfx_fog', 1); cvar.set('gfx_fog_density', 0.012);
      cvar.set('gfx_shadows', 2); cvar.set('gfx_bloom_intensity', 0.4);
      cvar.set('gfx_godrays', 1); cvar.set('gfx_godrays_intensity', 1.2);
    }
  },

  _ensureRT(w, h) {
    if (this._width === w && this._height === h && this._rt) return;
    this._width = w; this._height = h;
    var opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.UnsignedByteType, depthBuffer: true };

    if (this._rt) this._rt.dispose();
    if (this._rt2) this._rt2.dispose();
    if (this._rt3) this._rt3.dispose();
    if (this._rt4) this._rt4.dispose();
    this._rt = new THREE.WebGLRenderTarget(w, h, opts);
    this._rt2 = new THREE.WebGLRenderTarget(w, h, opts);
    this._rt3 = new THREE.WebGLRenderTarget(w, h, opts);
    opts.minFilter = THREE.LinearFilter; opts.magFilter = THREE.LinearFilter;
    this._rt4 = new THREE.WebGLRenderTarget(Math.max(1, w>>2), Math.max(1, h>>2), opts);
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
        tDiffuse: { value: null }, tBloom: { value: null }, tGodRays: { value: null },
        bloomIntensity: { value: 0.25 }, godRayIntensity: { value: 1.0 },
        vignetteAmount: { value: 0.35 },
        saturation: { value: 1.0 }, contrast: { value: 1.0 }
      },
      vertexShader: brightVert, fragmentShader: combineFrag, depthWrite: false, depthTest: false
    });

    this._godRaysMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null }, sunPos: { value: new THREE.Vector2(0.5, 0.5) },
        intensity: { value: 1.0 }, decay: { value: 0.97 }, weight: { value: 0.03 }
      },
      vertexShader: brightVert, fragmentShader: godRaysFrag, depthWrite: false, depthTest: false
    });

    this._fsqBright = new Fsq(this._brightMat);
    this._fsqBlurH = new Fsq(this._blurHMat);
    this._fsqBlurV = new Fsq(this._blurVMat);
    this._fsqCombine = new Fsq(this._combineMat);
    this._fsqGodRays = new Fsq(this._godRaysMat);

    this._blurHMat.uniforms.resolution.value.set(this._width || 1, this._height || 1);
    this._blurVMat.uniforms.resolution.value.set(this._width || 1, this._height || 1);
  },

  _updateShadows() {
    var shadowQuality = cvar.get('gfx_shadows') || 0;
    if (!this._renderer) return;

    if (shadowQuality > 0) {
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type = shadowQuality > 1 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;

      if (game && game.scene) {
        game.scene.traverse(function(m) {
          if (m.isDirectionalLight || m.isSpotLight) {
            m.castShadow = true;
            m.shadow.mapSize.width = shadowQuality > 1 ? 2048 : 1024;
            m.shadow.mapSize.height = shadowQuality > 1 ? 2048 : 1024;
            // map_sun/shadow camera ayarlarini koru, ustune yazma
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
    // game baslamadiysa normal render
    var g = window.game || game;
    var gs = window.gameStarted || (typeof gameStarted !== 'undefined' ? gameStarted : false);
    if (!gs) {
      renderer.render(scene, camera);
      return;
    }
    this._scene = scene;
    this._camera = camera;
    this._renderer = renderer;

    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;

    // PP icin ortho kamera
    if (!this._ppCamera) {
      this._ppCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    // Fog — sadece gameplay'de dokun (intro kendi fog'unu yonetir)
    if (window.gameStarted && cvar.get('gfx_fog') && scene) {
      scene.fog = new THREE.FogExp2(0x111122, cvar.get('gfx_fog_density') || 0.008);
    } else if (window.gameStarted && scene) {
      scene.fog = null;
    }

    // Shadows
    this._updateShadows();

    // Bloom check
    var doBloom = cvar.get('gfx_bloom') && cvar.get('gfx_bloom_intensity') > 0.01;
    var doGodRays = cvar.get('gfx_godrays') && cvar.get('gfx_godrays_intensity') > 0.01;
    var doVignette = cvar.get('gfx_vignette');
    var doColor = Math.abs(cvar.get('gfx_saturation') - 1.0) > 0.01 || Math.abs(cvar.get('gfx_contrast') - 1.0) > 0.01;

    if (!doBloom && !doGodRays && !doVignette && !doColor) {
      renderer.render(scene, camera);
      return;
    }

    // Init
    this._ensureRT(w, h);
    this._initShaders();
    this._brightMat.uniforms.threshold.value = cvar.get('gfx_bloom_threshold') || 0.2;

    // God rays kullanilmiyorsa combine'daki intensity sifirla
    if (!doGodRays) {
      this._combineMat.uniforms.godRayIntensity.value = 0;
    }

    // RT cozunurluklerini blur icin ayarla
    this._blurHMat.uniforms.resolution.value.set(w, h);
    this._blurVMat.uniforms.resolution.value.set(w, h);
    this._combineMat.uniforms.bloomIntensity.value = cvar.get('gfx_bloom_intensity') || 0.8;
    this._combineMat.uniforms.godRayIntensity.value = doGodRays ? 1.0 : 0;
    this._combineMat.uniforms.vignetteAmount.value = doVignette ? (cvar.get('gfx_vignette_amount') || 0.35) : 0;
    this._combineMat.uniforms.saturation.value = cvar.get('gfx_saturation') || 1.0;
    this._combineMat.uniforms.contrast.value = cvar.get('gfx_contrast') || 1.0;

    // Pass 1: Render scene to RT
    renderer.setRenderTarget(this._rt);
    renderer.render(scene, camera);

    // Pass 2: God rays from scene tex → RT4 (yarim cozunurlukte, luminance agirlikli)
    if (doGodRays) {
      var sunUV = this._findSunUV(scene, camera);
      this._godRaysMat.uniforms.sunPos.value.copy(sunUV);
      this._godRaysMat.uniforms.intensity.value = cvar.get('gfx_godrays_intensity') || 1.0;
      this._godRaysMat.uniforms.tDiffuse.value = this._rt.texture;
      renderer.setRenderTarget(this._rt4);
      renderer.render(this._fsqGodRays, this._ppCamera);
      this._combineMat.uniforms.tGodRays.value = this._rt4.texture;
    } else {
      this._combineMat.uniforms.tGodRays.value = this._rt.texture;
      this._combineMat.uniforms.godRayIntensity.value = 0;
    }

    if (doBloom) {
      // Pass 3: Extract bright → RT2
      this._brightMat.uniforms.tDiffuse.value = this._rt.texture;
      renderer.setRenderTarget(this._rt2);
      renderer.render(this._fsqBright, this._ppCamera);

      // Pass 4: Blur H → RT3
      this._blurHMat.uniforms.tDiffuse.value = this._rt2.texture;
      renderer.setRenderTarget(this._rt3);
      renderer.render(this._fsqBlurH, this._ppCamera);

      // Pass 5: Blur V → RT2
      this._blurVMat.uniforms.tDiffuse.value = this._rt3.texture;
      renderer.setRenderTarget(this._rt2);
      renderer.render(this._fsqBlurV, this._ppCamera);

      this._combineMat.uniforms.tBloom.value = this._rt2.texture;
    } else {
      this._combineMat.uniforms.tBloom.value = this._rt.texture;
      this._combineMat.uniforms.bloomIntensity.value = 0;
    }

    // Pass 6: Combine → screen
    this._combineMat.uniforms.tDiffuse.value = this._rt.texture;
    renderer.setRenderTarget(null);
    renderer.render(this._fsqCombine, this._ppCamera);
  },

  _findSunUV(scene, camera) {
    if (!scene || !camera) { this._sunUV.set(0.5, 0.5); return this._sunUV; }
    this._sunVec.set(0, 0, 0);
    scene.traverse(function(obj) {
      if (obj.isDirectionalLight && !this._sunVec.length()) {
        obj.getWorldPosition(this._sunVec);
      }
    }.bind(this));
    if (!this._sunVec.length() || (this._sunVec.x === 0 && this._sunVec.y === 0 && this._sunVec.z === 0)) {
      this._sunUV.set(0.5, 0.5);
      return this._sunUV;
    }
    var sp = this._sunVec.project(camera);
    this._sunUV.set(
      Math.max(0.0, Math.min(1.0, sp.x * 0.5 + 0.5)),
      Math.max(0.0, Math.min(1.0, sp.y * 0.5 + 0.5))
    );
    return this._sunUV;
  },

  destroy() {
    if (this._rt) this._rt.dispose();
    if (this._rt2) this._rt2.dispose();
    if (this._rt3) this._rt3.dispose();
    if (this._rt4) this._rt4.dispose();
    this._rt = this._rt2 = this._rt3 = this._rt4 = null;
    plugin.off('game:start', this.id);
    if (commands) commands.unregister('gfx_postprocessing', 'gfx');
  }
});
