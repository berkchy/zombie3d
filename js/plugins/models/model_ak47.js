var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'model_ak47',
  name: 'AK-47 Model',
  type: 'model',
  version: '1.5',
  description: 'AK-47 viewmodel from .mdl + native animations',
  enabled: true,
  forceEnabled: true,

  _mdlFile: null,
  _ready: false,
  _pendingCb: null,
  _cachedGroup: null,

  init() {
    console.log('[model_ak47] init');
    var self = this;
    loader.loadScript('model_mdl', function() {
      console.log('[model_ak47] model_mdl loaded, starting XHR');
      var mdl = plugin.get('model_mdl');
      if (!mdl) { console.log('[model_ak47] mdl plugin not found'); return; }
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'assets/models/v_ak47.mdl', true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        if (xhr.status !== 200 && xhr.status !== 0) { console.error('[model_ak47] HTTP', xhr.status); return; }
        try {
          self._mdlFile = mdl.parse(xhr.response);
          self._ready = true;
          console.log('[model_ak47] parse OK, ready=true');
          if (self._pendingCb) { self._pendingCb(); self._pendingCb = null; }
        } catch(e) { console.error('[model_ak47] parse error', e); }
      };
      xhr.onerror = function() { console.error('[model_ak47] network error'); };
      xhr.send();
    });
  },

  createModel() {
    console.log('[model_ak47] createModel called, _ready=' + this._ready + ' cached=' + (this._cachedGroup !== null));
    if (this._cachedGroup) {
      console.log('[model_ak47] returning cached group');
      return this._cachedGroup;
    }
    if (this._ready && this._mdlFile) {
      console.log('[model_ak47] building from .mdl');
      this._cachedGroup = this._build();
      return this._cachedGroup;
    }
    console.log('[model_ak47] not ready, returning test cube');
    var self = this;
    this._pendingCb = function() {
      console.log('[model_ak47] _pendingCb fired');
      var fp = plugin.get('fx_firstperson');
      if (!fp || !fp._viewGroup || !fp._arms) { console.log('[model_ak47] _pendingCb: fp not ready'); return; }
      var slot = fp._arms.slot;
      if (!slot) { console.log('[model_ak47] _pendingCb: no slot'); return; }
      var old = slot.getObjectByName('ak47_model');
      if (old) slot.remove(old);
      var wp = plugin.get('weapon_ak47');
      if (wp && wp._onModelReady) { console.log('[model_ak47] calling _onModelReady'); wp._onModelReady(); }
      else console.log('[model_ak47] wp or _onModelReady missing');
    };
    var cube = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({color: 0xff0000}));
    cube.name = 'ak47_model';
    return cube;
  },

  _build: function() {
    console.log('[model_ak47] _build starting');
    var mdl = plugin.get('model_mdl');
    if (!mdl) return new THREE.Group();
    var mdlFile = this._mdlFile;
    console.log('[model_ak47] mdlFile bones:', mdlFile.bones.length, 'bodyParts:', mdlFile.bodyParts.length, 'textures:', mdlFile.textures.length, 'sequences:', mdlFile.sequences.length);

    // Manual build step by step to isolate hang
    var THREE = window.THREE;
    var group = new THREE.Group();
    group.name = '[ROOT]';

    console.log('[model_ak47] creating bones...');
    var srcbones = mdlFile.bones;
    var bones = [];
    for (var i = 0; i < srcbones.length; i++) {
      var a = srcbones[i];
      var b = new THREE.Bone();
      b.position.set(a.value[0], a.value[1], a.value[2]);
      b.rotation.set(a.value[3], a.value[4], a.value[5], 'ZYX');
      b.name = a.name;
      bones.push(b);
    }
    console.log('[model_ak47] building hierarchy...');
    for (var i = 0; i < srcbones.length; i++) {
      for (var j = 0; j < srcbones.length; j++) {
        if (srcbones[j].parent === i) { bones[i].add(bones[j]); }
      }
    }
    var boneGroup = new THREE.Group();
    boneGroup.name = '[BONE]';
    for (var i = 0; i < srcbones.length; i++) {
      if (srcbones[i].parent === -1) boneGroup.add(bones[i]);
    }
    group.add(boneGroup);
    console.log('[model_ak47] creating skeleton...');
    var skeleton = new THREE.Skeleton(bones);

    console.log('[model_ak47] creating textures...');
    var textures = [];
    mdlFile.textures.forEach(function(a) {
      var b = new THREE.DataTexture(a.data, a.width, a.height, THREE.RGBAFormat, THREE.UnsignedByteType,
        THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter);
      b.name = a.name;
      b.needsUpdate = true;
      textures.push(b);
    });

    console.log('[model_ak47] building meshes...');
    var bodyGroup = new THREE.Group();
    bodyGroup.name = '[BODY]';
    var totalMeshes = 0;
    mdlFile.bodyParts.forEach(function(a) {
      var partGroup = new THREE.Group();
      partGroup.name = '[PART]';
      a.models.forEach(function(b) {
        var position = [], normal = [], uv = [], skinIndex = [], skinWeight = [];
        for (var vi = 0; vi < b.vertices.length; vi++) {
          var c = b.vertices[vi];
          position.push(c.position.x, c.position.y, c.position.z);
          normal.push(c.normal.x, c.normal.y, c.normal.z);
          uv.push(c.texCoord.x, c.texCoord.y);
          skinIndex.push(c.bone, 0, 0, 0);
          skinWeight.push(1, 0, 0, 0);
        }
        var aPosition = new THREE.Float32BufferAttribute(position, 3);
        var aNormal = new THREE.Float32BufferAttribute(normal, 3);
        var aUV = new THREE.Float32BufferAttribute(uv, 2);
        var aSkinIndex = new THREE.Uint8BufferAttribute(skinIndex, 4);
        var aSkinWeight = new THREE.Float32BufferAttribute(skinWeight, 4);

        var meshGroup = new THREE.Group();
        meshGroup.name = b.name;
        b.mesh.forEach(function(c) {
          var geo = new THREE.BufferGeometry();
          geo.dispose = function(){};
          geo.setAttribute('position', aPosition);
          geo.setAttribute('normal', aNormal);
          geo.setAttribute('uv', aUV);
          geo.setAttribute('skinIndex', aSkinIndex);
          geo.setAttribute('skinWeight', aSkinWeight);
          geo.setIndex(c.indices);

          var mat = new THREE.MeshBasicMaterial({
            map: textures[mdlFile.skinfamilies[0][c.skinref]],
            skinning: true,
            side: THREE.DoubleSide
          });
          mat.dispose = function(){};

          var mesh = new THREE.SkinnedMesh(geo, mat);
          mesh.bind(skeleton);
          meshGroup.add(mesh);
          totalMeshes++;
        });
        partGroup.add(meshGroup);
      });
      bodyGroup.add(partGroup);
    });
    group.add(bodyGroup);
    console.log('[model_ak47] meshes built:', totalMeshes);

    console.log('[model_ak47] rotating bone group...');
    boneGroup.rotateX(-1.570796);

    console.log('[model_ak47] creating animations...');
    var animations = [];
    mdlFile.sequences.forEach(function(a) {
      var duration = a.frames.length / a.fps;
      var tracks = [];
      for (var i = 0; i < srcbones.length; i++) {
        var timeval = [];
        var posvals = [];
        var rotvals = [];
        for (var j = 0; j < a.frames.length; j++) {
          timeval.push(j / a.frames.length * duration);
          posvals.push(a.frames[j].pos[i].x, a.frames[j].pos[i].y, a.frames[j].pos[i].z);
          rotvals.push(a.frames[j].rot[i].x, a.frames[j].rot[i].y, a.frames[j].rot[i].z, a.frames[j].rot[i].w);
        }
        var posTrack = new THREE.VectorKeyframeTrack(srcbones[i].name + '.position', timeval, posvals);
        var rotTrack = new THREE.QuaternionKeyframeTrack(srcbones[i].name + '.quaternion', timeval, rotvals);
        tracks.push(posTrack, rotTrack);
      }
      var clip = new THREE.AnimationClip(a.label, duration, tracks);
      animations.push(clip);
    });
    console.log('[model_ak47] animations created:', animations.length);

    group.name = 'ak47_model';
    var mixer = new THREE.AnimationMixer(group);
    var clips = {};
    for (var i = 0; i < animations.length; i++) {
      var c = animations[i];
      clips[c.name] = c;
    }
    group.userData.mixer = mixer;
    group.userData.clips = clips;
    console.log('[model_ak47] _build done');
    return group;
  }
});
