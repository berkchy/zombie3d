var plugin = include('registry');

// ── HLSDK 3×4 row-major affine matrix helpers (port of studio_util.cpp) ────

function quaternionMatrix(q) {
  var x = q.x, y = q.y, z = q.z, w = q.w;
  var m = new Float32Array(12);
  m[0]  = 1 - 2 * y * y - 2 * z * z;
  m[1]  = 2 * (x * y - w * z);
  m[2]  = 2 * (x * z + w * y);
  m[3]  = 0;
  m[4]  = 2 * (x * y + w * z);
  m[5]  = 1 - 2 * x * x - 2 * z * z;
  m[6]  = 2 * (y * z - w * x);
  m[7]  = 0;
  m[8]  = 2 * (x * z - w * y);
  m[9]  = 2 * (y * z + w * x);
  m[10] = 1 - 2 * x * x - 2 * y * y;
  m[11] = 0;
  return m;
}

function concatTransforms(a, b, out) {
  out[0]  = a[0] * b[0]  + a[1] * b[4]  + a[2] * b[8];
  out[1]  = a[0] * b[1]  + a[1] * b[5]  + a[2] * b[9];
  out[2]  = a[0] * b[2]  + a[1] * b[6]  + a[2] * b[10];
  out[3]  = a[0] * b[3]  + a[1] * b[7]  + a[2] * b[11] + a[3];
  out[4]  = a[4] * b[0]  + a[5] * b[4]  + a[6] * b[8];
  out[5]  = a[4] * b[1]  + a[5] * b[5]  + a[6] * b[9];
  out[6]  = a[4] * b[2]  + a[5] * b[6]  + a[6] * b[10];
  out[7]  = a[4] * b[3]  + a[5] * b[7]  + a[6] * b[11] + a[7];
  out[8]  = a[8] * b[0]  + a[9] * b[4]  + a[10] * b[8];
  out[9]  = a[8] * b[1]  + a[9] * b[5]  + a[10] * b[9];
  out[10] = a[8] * b[2]  + a[9] * b[6]  + a[10] * b[10];
  out[11] = a[8] * b[3]  + a[9] * b[7]  + a[10] * b[11] + a[11];
}

function vectorTransform(v, m) {
  return new Vec3(
    v.x * m[0] + v.y * m[1] + v.z * m[2]  + m[3],
    v.x * m[4] + v.y * m[5] + v.z * m[6]  + m[7],
    v.x * m[8] + v.y * m[9] + v.z * m[10] + m[11]
  );
}

function normalTransform(v, m) {
  return new Vec3(
    v.x * m[0] + v.y * m[1] + v.z * m[2],
    v.x * m[4] + v.y * m[5] + v.z * m[6],
    v.x * m[8] + v.y * m[9] + v.z * m[10]
  );
}

/** World-space bone matrices for one frame. frame = {rot,pos} arrays, or null for rest. */
function computeWorldMatrices(srcbones, frame) {
  var world = [];
  for (var i = 0; i < srcbones.length; i++) {
    var bone = srcbones[i];
    var q = frame ? frame.rot[i] : angleQuaternion(new Vec3(bone.value[3], bone.value[4], bone.value[5]));
    var p = frame ? frame.pos[i] : new Vec3(bone.value[0], bone.value[1], bone.value[2]);
    var local = quaternionMatrix(q);
    local[3] = p.x; local[7] = p.y; local[11] = p.z;
    if (bone.parent >= 0 && bone.parent < world.length) {
      var out = new Float32Array(12);
      concatTransforms(world[bone.parent], local, out);
      world.push(out);
    } else {
      world.push(local);
    }
  }
  return world;
}

function playClip(group, name, opts) {
  opts = opts || {};
  var userData = group.userData || {};
  var clips = userData.clips;
  if (!clips) return null;
  var seq = clips[name];
  if (!seq) return null;

  if (userData._currentAnim) {
    userData._currentAnim.onComplete = null;
    userData._currentAnim = null;
  }

  // speed: 'default' = clip'in kendi fps'i, '40'/'40fps' = hedef fps
  var rate = seq.fps || 30;
  if (opts.speed && opts.speed !== 'default') {
    var m = String(opts.speed).match(/(\d+(?:\.\d+)?)/);
    var targetFps = m ? parseFloat(m[1]) : 0;
    if (targetFps > 0) rate = targetFps;
  }

  var anim = {
    seq: seq,
    t: 0,
    rate: rate,
    loop: opts.loop !== undefined ? opts.loop : true,
    onComplete: typeof opts.onComplete === 'function' ? opts.onComplete : null,
    done: false
  };
  userData._currentAnim = anim;
  group.setPose(seq, 0);

  var action = {
    stop: function() {
      if (userData._currentAnim === anim) {
        anim.onComplete = null;
        userData._currentAnim = null;
      }
    },
    isRunning: function() { return userData._currentAnim === anim && !anim.done; }
  };
  return action;
}

var Vec2 = function(x, y) { this.x = x; this.y = y; };
Vec2.prototype.equal = function(o) { return this.x === o.x && this.y === o.y; };

var Vec3 = function(x, y, z) { this.x = x; this.y = y; this.z = z; };
Vec3.prototype.equal = function(o) { return this.x === o.x && this.y === o.y && this.z === o.z; };

var Vec4 = function(x, y, z, w) { this.x = x; this.y = y; this.z = z; this.w = w; };
Vec4.prototype.equal = function(o) { return this.x === o.x && this.y === o.y && this.z === o.z && this.w === o.w; };

function angleQuaternion(angles) {
  var angle = angles.z * 0.5;
  var sy = Math.sin(angle), cy = Math.cos(angle);
  angle = angles.y * 0.5;
  var sp = Math.sin(angle), cp = Math.cos(angle);
  angle = angles.x * 0.5;
  var sr = Math.sin(angle), cr = Math.cos(angle);
  return new Vec4(
    sr * cp * cy - cr * sp * sy,
    cr * sp * cy + sr * cp * sy,
    cr * cp * sy - sr * sp * cy,
    cr * cp * cy + sr * sp * sy
  );
}

function quaternionSlerp(p_, q_, t) {
  var qt = [0, 0, 0, 0];
  var p = [p_.x, p_.y, p_.z, p_.w];
  var q = [q_.x, q_.y, q_.z, q_.w];
  var a = 0, b = 0;
  for (var i = 0; i < 4; i++) { a += (p[i] - q[i]) * (p[i] - q[i]); b += (p[i] + q[i]) * (p[i] + q[i]); }
  if (a > b) { for (var i = 0; i < 4; i++) q[i] = -q[i]; }
  var cosom = p[0] * q[0] + p[1] * q[1] + p[2] * q[2] + p[3] * q[3];
  if ((1.0 + cosom) > 0.00000001) {
    var sclp, sclq;
    if ((1.0 - cosom) > 0.00000001) {
      var omega = Math.acos(cosom);
      var sinom = Math.sin(omega);
      sclp = Math.sin((1.0 - t) * omega) / sinom;
      sclq = Math.sin(t * omega) / sinom;
    } else { sclp = 1.0 - t; sclq = t; }
    for (var i = 0; i < 4; i++) qt[i] = sclp * p[i] + sclq * q[i];
  } else {
    qt[0] = -p[1]; qt[1] = p[0]; qt[2] = -p[3]; qt[3] = p[2];
    sclp = Math.sin((1.0 - t) * 0.5 * Math.PI);
    sclq = Math.sin(t * 0.5 * Math.PI);
    for (var i = 0; i < 3; i++) qt[i] = sclp * p[i] + sclq * qt[i];
  }
  return new Vec4(qt[0], qt[1], qt[2], qt[3]);
}

var BinaryReader = function(buffer, littleEndian) {
  this.buffer = buffer;
  this.view = new DataView(buffer);
  this.littleEndian = littleEndian;
  this.offset = 0;
};
BinaryReader.prototype.setOffset = function(offset) {
  if (offset < 0 || offset > this.buffer.byteLength) throw new RangeError('offset out of buffer');
  this.offset = offset;
};
BinaryReader.prototype.getLength = function() { return this.buffer.byteLength; };
BinaryReader.prototype.readBuffer = function(length) {
  var result = this.buffer.slice(this.offset, this.offset + length);
  this.offset += length;
  return result;
};
BinaryReader.prototype.readInt8 = function() { var v = this.view.getInt8(this.offset); this.offset += 1; return v; };
BinaryReader.prototype.readUint8 = function(pos) {
  if (pos !== undefined) return this.view.getUint8(pos);
  var v = this.view.getUint8(this.offset); this.offset += 1; return v;
};
BinaryReader.prototype.readUint16 = function(pos) {
  if (pos !== undefined) return this.view.getUint16(pos, this.littleEndian);
  var v = this.view.getUint16(this.offset, this.littleEndian); this.offset += 2; return v;
};
BinaryReader.prototype.readInt16 = function(pos) {
  if (pos !== undefined) return this.view.getInt16(pos, this.littleEndian);
  var v = this.view.getInt16(this.offset, this.littleEndian); this.offset += 2; return v;
};
BinaryReader.prototype.readInt32 = function() { var v = this.view.getInt32(this.offset, this.littleEndian); this.offset += 4; return v; };
BinaryReader.prototype.readUint32 = function() { var v = this.view.getUint32(this.offset, this.littleEndian); this.offset += 4; return v; };
BinaryReader.prototype.readFloat = function() { var v = this.view.getFloat32(this.offset, this.littleEndian); this.offset += 4; return v; };
BinaryReader.prototype.readString = function(length) {
  var array = new Uint8Array(this.buffer, this.offset, length);
  this.offset += length;
  var end = Array.prototype.findIndex.call(array, function(v) { return v === 0; });
  if (end === 0) return '';
  if (end === -1) end = length;
  var result = '';
  for (var i = 0; i < end; i++) result += String.fromCharCode(array[i]);
  return result;
};
BinaryReader.prototype.readInt16Array = function(count) {
  var arr = [];
  for (var i = 0; i < count; i++) arr.push(this.readInt16());
  return arr;
};
BinaryReader.prototype.readInt32Array = function(count) {
  var arr = [];
  for (var i = 0; i < count; i++) arr.push(this.readInt32());
  return arr;
};
BinaryReader.prototype.readUint32Array = function(count) {
  var arr = [];
  for (var i = 0; i < count; i++) arr.push(this.readUint32());
  return arr;
};
BinaryReader.prototype.readFloatArray = function(count) {
  var arr = [];
  for (var i = 0; i < count; i++) arr.push(this.readFloat());
  return arr;
};
BinaryReader.prototype.readVec3 = function() {
  return new Vec3(this.readFloat(), this.readFloat(), this.readFloat());
};

function MDLFile() {
  this.header = null;
  this.bones = null;
  this.boneControllers = null;
  this.attachments = null;
  this.hitBoxes = null;
  this.sequences = null;
  this.sequenceGroups = null;
  this.bodyParts = null;
  this.textures = null;
  this.skinfamilies = null;
}

MDLFile.prototype.load = function(buffer) {
  var reader = new BinaryReader(buffer, true);
  this.readHeader(reader);
  this.readBone(reader);
  this.readSequence(reader);
  this.readTexture(reader);
  this.readModel(reader);
};

MDLFile.prototype.readHeader = function(reader) {
  reader.setOffset(0);
  var h = {};
  h.id = reader.readUint32();
  if (h.id !== 0x54534449) throw new Error('not studio model file');
  h.version = reader.readUint32();
  if (h.version !== 0x0A) throw new Error('not supported version');
  h.name = reader.readString(64);
  h.length = reader.readUint32();
  if (h.length !== reader.getLength()) throw new Error('invalid file length');
  h.eyeposition = reader.readVec3();
  h.min = reader.readVec3();
  h.max = reader.readVec3();
  h.bbmin = reader.readVec3();
  h.bbmax = reader.readVec3();
  h.flags = reader.readUint32();
  h.numbones = reader.readUint32();
  h.boneindex = reader.readUint32();
  h.numbonecontrollers = reader.readUint32();
  h.bonecontrollerindex = reader.readUint32();
  h.numhitboxes = reader.readUint32();
  h.hitboxindex = reader.readUint32();
  h.numseq = reader.readUint32();
  h.seqindex = reader.readUint32();
  h.numseqgroups = reader.readUint32();
  h.seqgroupindex = reader.readUint32();
  h.numtextures = reader.readUint32();
  h.textureindex = reader.readUint32();
  h.texturedataindex = reader.readUint32();
  h.numskinref = reader.readUint32();
  h.numskinfamilies = reader.readUint32();
  h.skinindex = reader.readUint32();
  h.numbodyparts = reader.readUint32();
  h.bodypartindex = reader.readUint32();
  h.numattachments = reader.readUint32();
  h.attachmentindex = reader.readUint32();
  h.soundtable = reader.readUint32();
  h.soundindex = reader.readUint32();
  h.soundgroups = reader.readUint32();
  h.soundgroupindex = reader.readUint32();
  h.numtransitions = reader.readUint32();
  h.transitionindex = reader.readUint32();
  this.header = h;
};

MDLFile.prototype.readBone = function(reader) {
  var fixName = function(s) {
    s = s.replace(/\[/g, '_');
    s = s.replace(/\]/g, '_');
    s = s.replace(/\./g, '_');
    return s;
  };
  reader.setOffset(this.header.boneindex);
  this.bones = [];
  for (var i = 0; i < this.header.numbones; i++) {
    var a = {};
    a.name = fixName(reader.readString(32));
    a.parent = reader.readInt32();
    a.flags = reader.readUint32();
    a.bonecontroller = reader.readInt32Array(6);
    a.value = reader.readFloatArray(6);
    a.scale = reader.readFloatArray(6);
    this.bones.push(a);
  }
  reader.setOffset(this.header.bonecontrollerindex);
  this.boneControllers = [];
  for (var i = 0; i < this.header.numbonecontrollers; i++) {
    var a = {};
    a.bone = reader.readUint32();
    a.type = reader.readUint32();
    a.start = reader.readFloat();
    a.end = reader.readFloat();
    a.rest = reader.readUint32();
    a.index = reader.readUint32();
    this.boneControllers.push(a);
  }
  reader.setOffset(this.header.attachmentindex);
  this.attachments = [];
  for (var i = 0; i < this.header.numattachments; i++) {
    var a = {};
    a.name = reader.readString(32);
    a.type = reader.readUint32();
    a.bone = reader.readUint32();
    a.org = reader.readVec3();
    a.vectors = [reader.readVec3(), reader.readVec3(), reader.readVec3()];
    this.attachments.push(a);
  }
  reader.setOffset(this.header.hitboxindex);
  this.hitBoxes = [];
  for (var i = 0; i < this.header.numhitboxes; i++) {
    var a = {};
    a.bone = reader.readUint32();
    a.group = reader.readUint32();
    a.bbmin = reader.readVec3();
    a.bbmax = reader.readVec3();
    this.hitBoxes.push(a);
  }
};

MDLFile.prototype.readSequence = function(reader) {
  reader.setOffset(this.header.seqindex);
  this.sequences = [];
  for (var i = 0; i < this.header.numseq; i++) {
    var a = {};
    a.label = reader.readString(32);
    a.fps = reader.readFloat();
    a.flags = reader.readUint32();
    a.activity = reader.readUint32();
    a.actweight = reader.readUint32();
    a.numevents = reader.readUint32();
    a.eventindex = reader.readUint32();
    a.numframes = reader.readUint32();
    a.numpivots = reader.readUint32();
    a.pivotindex = reader.readUint32();
    a.motiontype = reader.readUint32();
    a.motionbone = reader.readUint32();
    a.linearmovement = reader.readVec3();
    a.automoveposindex = reader.readUint32();
    a.automoveangleindex = reader.readUint32();
    a.bbmin = reader.readVec3();
    a.bbmax = reader.readVec3();
    a.numblends = reader.readUint32();
    a.animindex = reader.readUint32();
    a.blendtype = reader.readUint32Array(2);
    a.blendstart = reader.readFloatArray(2);
    a.blendend = reader.readFloatArray(2);
    a.blendparent = reader.readUint32();
    a.seqgroup = reader.readUint32();
    a.entrynode = reader.readUint32();
    a.exitnode = reader.readUint32();
    a.nodeflags = reader.readUint32();
    a.nextseq = reader.readUint32();
    this.sequences.push(a);
  }
  this.sequences.forEach(function(seq) {
    reader.setOffset(seq.eventindex);
    seq.events = [];
    for (var i = 0; i < seq.numevents; i++) {
      var e = {};
      e.frame = reader.readUint32();
      e.event = reader.readUint32();
      e.type = reader.readUint32();
      e.options = reader.readString(64);
      seq.events.push(e);
    }
    reader.setOffset(seq.pivotindex);
    seq.pivots = [];
    for (var i = 0; i < seq.numpivots; i++) {
      var p = {};
      p.org = reader.readVec3();
      p.start = reader.readUint32();
      p.end = reader.readUint32();
      seq.pivots.push(p);
    }
  });
  reader.setOffset(this.header.seqgroupindex);
  this.sequenceGroups = [];
  for (var i = 0; i < this.header.numseqgroups; i++) {
    var a = {};
    a.label = reader.readString(32);
    a.name = reader.readString(64);
    a.cache = reader.readUint32();
    a.data = reader.readUint32();
    this.sequenceGroups.push(a);
  }
  reader.setOffset(this.header.transitionindex);
  for (var i = 0; i < this.header.numtransitions; i++) {
    for (var j = 0; j < this.header.numtransitions; j++) {
      reader.readUint8();
    }
  }
  this.sequences.forEach(function(seq) {
    this.readAnimationFrame(reader, seq);
  }, this);
};

MDLFile.prototype.readModel = function(reader) {
  reader.setOffset(this.header.bodypartindex);
  this.bodyParts = [];
  for (var i = 0; i < this.header.numbodyparts; i++) {
    var a = {};
    a.name = reader.readString(64);
    a.nummodels = reader.readUint32();
    a.base = reader.readUint32();
    a.modelindex = reader.readUint32();
    this.bodyParts.push(a);
  }
  this.bodyParts.forEach(function(a) {
    reader.setOffset(a.modelindex);
    a.models = [];
    for (var i = 0; i < a.nummodels; i++) {
      var b = {};
      b.name = reader.readString(64);
      b.type = reader.readUint32();
      b.boundingradius = reader.readFloat();
      b.nummesh = reader.readUint32();
      b.meshindex = reader.readUint32();
      b.numverts = reader.readUint32();
      b.vertinfoindex = reader.readUint32();
      b.vertindex = reader.readUint32();
      b.numnorms = reader.readUint32();
      b.norminfoindex = reader.readUint32();
      b.normindex = reader.readUint32();
      b.numgroups = reader.readUint32();
      b.groupindex = reader.readUint32();
      a.models.push(b);
    }
    a.models.forEach(function(b) {
      reader.setOffset(b.meshindex);
      b.mesh = [];
      for (var i = 0; i < b.nummesh; i++) {
        var c = {};
        c.numtris = reader.readUint32();
        c.triindex = reader.readUint32();
        c.skinref = reader.readUint32();
        c.numnorms = reader.readUint32();
        c.normindex = reader.readUint32();
        b.mesh.push(c);
      }
      b.verts = [];
      for (var i = 0; i < b.numverts; i++) {
        b.verts.push({ bone: 0, vec: null });
      }
      reader.setOffset(b.vertinfoindex);
      for (var i = 0; i < b.numverts; i++) {
        b.verts[i].bone = reader.readUint8();
      }
      reader.setOffset(b.vertindex);
      for (var i = 0; i < b.numverts; i++) {
        b.verts[i].vec = reader.readVec3();
      }
      b.norms = [];
      for (var i = 0; i < b.numnorms; i++) {
        b.norms.push({ bone: 0, vec: null });
      }
      reader.setOffset(b.norminfoindex);
      for (var i = 0; i < b.numnorms; i++) {
        b.norms[i].bone = reader.readUint8();
      }
      reader.setOffset(b.normindex);
      for (var i = 0; i < b.numnorms; i++) {
        b.norms[i].vec = reader.readVec3();
      }
      this.rebuildModel(reader, b);
    }, this);
  }, this);
};

MDLFile.prototype.readTexture = function(reader) {
  reader.setOffset(this.header.textureindex);
  this.textures = [];
  for (var i = 0; i < this.header.numtextures; i++) {
    var a = {};
    a.name = reader.readString(64);
    a.flags = reader.readUint32();
    a.width = reader.readUint32();
    a.height = reader.readUint32();
    a.index = reader.readUint32();
    this.textures.push(a);
  }
  reader.setOffset(this.header.skinindex);
  this.skinfamilies = [];
  for (var i = 0; i < this.header.numskinfamilies; i++) {
    var skinref = [];
    for (var j = 0; j < this.header.numskinref; j++) {
      skinref.push(reader.readInt16());
    }
    this.skinfamilies.push(skinref);
  }
  this.textures.forEach(function(a) {
    this.readTextureData(reader, a);
  }, this);
};

MDLFile.prototype.rebuildModel = function(reader, model) {
  model.vertices = [];
  var addVertex = function(pos, norm, uv, bone) {
    var v = { position: pos, normal: norm, texCoord: uv, bone: bone };
    for (var i = 0; i < model.vertices.length; i++) {
      var o = model.vertices[i];
      if (o.position.equal(pos) && o.normal.equal(norm) && o.texCoord.equal(uv) && o.bone === bone) {
        return i;
      }
    }
    model.vertices.push(v);
    return model.vertices.length - 1;
  };
  model.mesh.forEach(function(a) {
    reader.setOffset(a.triindex);
    a.indices = [];
    var tex = this.textures[this.skinfamilies[0][a.skinref]];
    var i;
    while ((i = reader.readInt16()) !== 0) {
      var fan = false;
      if (i < 0) { fan = true; i = -i; }
      var buf = [];
      for (var j = 0; i > 0; i--, j++) {
        buf.push(reader.readInt16Array(4));
        if (j < 2) continue;
        var vi = [0, 0, 0];
        if (!fan) {
          if (j % 2) { vi[0] = j - 1; vi[1] = j - 2; vi[2] = j; }
          else { vi[0] = j - 2; vi[1] = j - 1; vi[2] = j; }
        } else {
          vi[0] = j; vi[1] = 0; vi[2] = j - 1;
        }
        a.indices.push(addVertex(
          model.verts[buf[vi[0]][0]].vec,
          model.norms[buf[vi[0]][1]].vec,
          new Vec2(buf[vi[0]][2] / tex.width, buf[vi[0]][3] / tex.height),
          model.verts[buf[vi[0]][0]].bone
        ));
        a.indices.push(addVertex(
          model.verts[buf[vi[1]][0]].vec,
          model.norms[buf[vi[1]][1]].vec,
          new Vec2(buf[vi[1]][2] / tex.width, buf[vi[1]][3] / tex.height),
          model.verts[buf[vi[1]][0]].bone
        ));
        a.indices.push(addVertex(
          model.verts[buf[vi[2]][0]].vec,
          model.norms[buf[vi[2]][1]].vec,
          new Vec2(buf[vi[2]][2] / tex.width, buf[vi[2]][3] / tex.height),
          model.verts[buf[vi[2]][0]].bone
        ));
      }
    }
    if (a.indices.length / 3 !== a.numtris) {
      console.warn('[MDL] triangle count mismatch');
    }
  }, this);
};

MDLFile.prototype.readAnimationFrame = function(reader, seq) {
  seq.frames = [];
  for (var i = 0; i < seq.numframes; i++) {
    var panim = 0;
    if (seq.seqgroup === 0) {
      panim = this.sequenceGroups[seq.seqgroup].data + seq.animindex;
    } else {
      throw new Error('External sequence groups not supported');
    }
    var a = {};
    a.pos = [];
    a.rot = [];
    for (var j = 0; j < this.bones.length; j++) {
      var rot = this.readBoneQuaternion(reader, this.bones[j], panim, i, 0);
      var pos = this.readBonePosition(reader, this.bones[j], panim, i, 0);
      panim += 12;
      a.rot.push(rot);
      a.pos.push(pos);
    }
    if (seq.motiontype & 0x0001) a.pos[seq.motionbone].x = 0.0;
    if (seq.motiontype & 0x0002) a.pos[seq.motionbone].y = 0.0;
    if (seq.motiontype & 0x0004) a.pos[seq.motionbone].z = 0.0;
    seq.frames.push(a);
  }
};

MDLFile.prototype.readBoneQuaternion = function(reader, bone, panim, frame, s) {
  var rot1 = [0, 0, 0], rot2 = [0, 0, 0];
  for (var j = 0; j < 3; j++) {
    var offset = reader.readUint16(panim + ((j + 3) * 2));
    if (offset === 0) {
      rot1[j] = rot2[j] = bone.value[j + 3];
    } else {
      var panimvalue = panim + offset;
      var k = frame;
      var valid = reader.readUint8(panimvalue);
      var total = reader.readUint8(panimvalue + 1);
      while (total <= k) {
        k -= total;
        panimvalue += (valid + 1) * 2;
        valid = reader.readUint8(panimvalue);
        total = reader.readUint8(panimvalue + 1);
      }
      if (valid > k) {
        rot1[j] = reader.readInt16(panimvalue + ((k + 1) * 2));
        if (valid > k + 1) {
          rot2[j] = reader.readInt16(panimvalue + ((k + 2) * 2));
        } else {
          if (total > k + 1) { rot2[j] = rot1[j]; }
          else { rot2[j] = reader.readInt16(panimvalue + ((valid + 2) * 2)); }
        }
      } else {
        rot1[j] = reader.readInt16(panimvalue + (valid * 2));
        if (total > k + 1) { rot2[j] = rot1[j]; }
        else { rot2[j] = reader.readInt16(panimvalue + ((valid + 2) * 2)); }
      }
      rot1[j] = bone.value[j + 3] + rot1[j] * bone.scale[j + 3];
      rot2[j] = bone.value[j + 3] + rot2[j] * bone.scale[j + 3];
    }
  }
  var r1 = new Vec3(rot1[0], rot1[1], rot1[2]);
  var r2 = new Vec3(rot2[0], rot2[1], rot2[2]);
  if (!r1.equal(r2)) {
    var q1 = angleQuaternion(r1);
    var q2 = angleQuaternion(r2);
    return quaternionSlerp(q1, q2, s);
  }
  return angleQuaternion(r1);
};

MDLFile.prototype.readBonePosition = function(reader, bone, panim, frame, s) {
  var pos = [0, 0, 0];
  for (var j = 0; j < 3; j++) {
    pos[j] = bone.value[j];
    var offset = reader.readUint16(panim + j * 2);
    if (offset !== 0) {
      var panimvalue = panim + offset;
      var k = frame;
      var valid = reader.readUint8(panimvalue);
      var total = reader.readUint8(panimvalue + 1);
      while (total <= k) {
        k -= total;
        panimvalue += (valid + 1) * 2;
        valid = reader.readUint8(panimvalue);
        total = reader.readUint8(panimvalue + 1);
      }
      if (valid > k) {
        if (valid > k + 1) {
          var v1 = reader.readInt16(panimvalue + ((k + 1) * 2));
          var v2 = reader.readInt16(panimvalue + ((k + 2) * 2));
          pos[j] += (v1 * (1.0 - s) + s * v2) * bone.scale[j];
        } else {
          var v1 = reader.readInt16(panimvalue + ((k + 1) * 2));
          pos[j] += v1 * bone.scale[j];
        }
      } else {
        if (total <= k + 1) {
          var v1 = reader.readInt16(panimvalue + (valid * 2));
          var v2 = reader.readInt16(panimvalue + ((valid + 2) * 2));
          pos[j] += (v1 * (1.0 - s) + s * v2) * bone.scale[j];
        } else {
          var v1 = reader.readInt16(panimvalue + (valid * 2));
          pos[j] += v1 * bone.scale[j];
        }
      }
    }
  }
  return new Vec3(pos[0], pos[1], pos[2]);
};

MDLFile.prototype.readTextureData = function(reader, texture) {
  reader.setOffset(texture.index);
  var indicesSize = texture.width * texture.height;
  var palSize = 256 * 3;
  var indices = new Uint8Array(reader.readBuffer(indicesSize));
  var pal = new Uint8Array(reader.readBuffer(palSize));
  var pixels = new Uint8Array(indicesSize * 4);
  for (var i = 0; i < indicesSize; i++) {
    var index = indices[i];
    var colorOffset = index * 3;
    var pixelOffset = i * 4;
    pixels[pixelOffset + 0] = pal[colorOffset + 0];
    pixels[pixelOffset + 1] = pal[colorOffset + 1];
    pixels[pixelOffset + 2] = pal[colorOffset + 2];
    pixels[pixelOffset + 3] = 255;
  }
  texture.data = pixels;
};

function buildModel(mdlFile) {
  var THREE = window.THREE;
  var group = new THREE.Group();
  group.name = '[ROOT]';

  var srcbones = mdlFile.bones;

  // GoldSrc → Three axis mapping, BAKED into the vertex data:
  //   HL X(forward) → Three -X(left), HL Y(up) → Three +Z(forward), HL Z(left) → Three +Y(up)
  // The model's barrel in this viewmodel rig runs along HL -Y, so this maps it
  // to Three -Z (forward). Baked so consumer transforms (fx_firstperson rotation)
  // can never corrupt the orientation.
  var Rg = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));

  var textures = [];
  mdlFile.textures.forEach(function(a) {
    var b = new THREE.DataTexture(a.data, a.width, a.height, THREE.RGBAFormat, THREE.UnsignedByteType,
      THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter);
    b.name = a.name;
    b.needsUpdate = true;
    textures.push(b);
  });

  var restWorld = computeWorldMatrices(srcbones, null);

  var seqIndex = {};
  mdlFile.sequences.forEach(function(s, si) { seqIndex[s.label] = si; });

  var seqInfos = mdlFile.sequences.map(function(s) {
    return { name: s.label, fps: s.fps, numFrames: s.frames.length, _index: seqIndex[s.label] };
  });

  var bodyGroup = new THREE.Group();
  bodyGroup.name = '[BODY]';
  var skinFamilies = mdlFile.skinfamilies;

  mdlFile.bodyParts.forEach(function(a) {
    var partGroup = new THREE.Group();
    partGroup.name = '[PART]';
    a.models.forEach(function(b) {
      var nv = b.vertices.length;
      var restPos = new Float32Array(nv * 3);
      var restNorm = new Float32Array(nv * 3);
      for (var vi = 0; vi < nv; vi++) {
        var c = b.vertices[vi];
        var p = vectorTransform(c.position, restWorld[c.bone]);
        var n = normalTransform(c.normal, restWorld[c.bone]);
        restPos[vi * 3]     = -p.x;
        restPos[vi * 3 + 1] =  p.z;
        restPos[vi * 3 + 2] =  p.y;
        restNorm[vi * 3]     = -n.x;
        restNorm[vi * 3 + 1] =  n.z;
        restNorm[vi * 3 + 2] =  n.y;
      }

      var posArr = new THREE.Float32BufferAttribute(restPos, 3);
      var normArr = new THREE.Float32BufferAttribute(restNorm, 3);
      var uvArr = new THREE.Float32BufferAttribute(nv * 2, 2);
      for (var ui = 0; ui < nv; ui++) {
        uvArr.array[ui * 2] = b.vertices[ui].texCoord.x;
        uvArr.array[ui * 2 + 1] = b.vertices[ui].texCoord.y;
      }

      var meshGroup = new THREE.Group();
      meshGroup.name = b.name;
      b.mesh.forEach(function(c) {
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', posArr);
        geo.setAttribute('normal', normArr);
        geo.setAttribute('uv', uvArr);
        geo.setIndex(c.indices);
        var mat = new THREE.MeshBasicMaterial({
          map: textures[skinFamilies[0][c.skinref]],
          side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        meshGroup.add(mesh);
      });
      partGroup.add(meshGroup);

      // ── Pre-bake every sequence × frame (HLSDK-exact) ─────────────────
      meshGroup._frames = [];
      mdlFile.sequences.forEach(function(seq, si) {
        var seqFrames = [];
        if (seq.frames) {
          for (var fi = 0; fi < seq.frames.length; fi++) {
            var W = computeWorldMatrices(srcbones, seq.frames[fi]);
            var fPos = new Float32Array(nv * 3);
            var fNorm = new Float32Array(nv * 3);
            for (var fvi = 0; fvi < nv; fvi++) {
              var fc = b.vertices[fvi];
              var fp = vectorTransform(fc.position, W[fc.bone]);
              var fn = normalTransform(fc.normal, W[fc.bone]);
              fPos[fvi * 3]     = -fp.x;
              fPos[fvi * 3 + 1] =  fp.z;
              fPos[fvi * 3 + 2] =  fp.y;
              fNorm[fvi * 3]     = -fn.x;
              fNorm[fvi * 3 + 1] =  fn.z;
              fNorm[fvi * 3 + 2] =  fn.y;
            }
            seqFrames.push({ pos: fPos, norm: fNorm });
          }
        }
        meshGroup._frames.push(seqFrames);
      });

      meshGroup._pos = posArr.array;
      meshGroup._norm = normArr.array;
      meshGroup._restPos = restPos;
      meshGroup._restNorm = restNorm;
      meshGroup._posAttr = posArr;
      meshGroup._normAttr = normArr;
    });
    bodyGroup.add(partGroup);
  });

  group.add(bodyGroup);

  var userData = group.userData;
  userData.clips = {};
  seqInfos.forEach(function(s) { userData.clips[s.name] = s; });

  group.setPose = function(seq, frameIdx) {
    var index = seq ? seq._index : -1;
    bodyGroup.traverse(function(n) {
      if (n._frames) {
        var useFrame = index >= 0 && n._frames[index] && frameIdx >= 0 && frameIdx < n._frames[index].length;
        var srcPos = useFrame ? n._frames[index][frameIdx].pos : n._restPos;
        var srcNorm = useFrame ? n._frames[index][frameIdx].norm : n._restNorm;
        n._pos.set(srcPos);
        n._norm.set(srcNorm);
        n._posAttr.needsUpdate = true;
        n._normAttr.needsUpdate = true;
      }
    });
  };

  group.update = function(dt) {
    var anim = userData._currentAnim;
    if (!anim || !anim.seq) return;
    anim.t += dt * anim.rate;
    var nf = anim.seq.numFrames;
    if (anim.t >= nf) {
      if (anim.loop) {
        anim.t = anim.t % nf;
      } else {
        anim.t = nf - 1;
        if (!anim.done) {
          anim.done = true;
          var cb = anim.onComplete;
          anim.onComplete = null;
          userData._currentAnim = null;
          if (cb) cb();
        }
      }
    }
    group.setPose(anim.seq, Math.floor(Math.min(anim.t, nf - 1)));
  };

  group.playClip = function(name, opts) {
    return playClip(group, name, opts);
  };

  // Compatibility shims (the weapon plugin calls these)
  group.rebindSkeleton = function() {};
  userData.mixer = { update: function(dt) { group.update(dt); } };

  group.animations = seqInfos;

  return {
    group: group,
    bones: srcbones,
    skeleton: null,
    animations: seqInfos,
    textures: textures,
    hitBoxes: mdlFile.hitBoxes,
    sequences: mdlFile.sequences
  };
}

plugin.register({
  id: 'model_mdl',
  name: 'GoldSrc .mdl Yukleyici',
  type: 'model',
  version: '1.0',
  description: 'Half-Life 1/GoldSrc .mdl model dosyalarini yukler, parse eder ve Three.js nesnelerine donusturur',
  enabled: true,
  forceEnabled: false,

  parse: function(buffer) {
    var mdl = new MDLFile();
    mdl.load(buffer);
    return mdl;
  },

  load: function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        try {
          var mdl = new MDLFile();
          mdl.load(xhr.response);
          callback(null, mdl);
        } catch (e) {
          callback(e, null);
        }
      } else {
        callback(new Error('HTTP ' + xhr.status), null);
      }
    };
    xhr.onerror = function() { callback(new Error('Network error'), null); };
    xhr.send();
  },

  build: function(mdlFile) {
    return buildModel(mdlFile);
  },

  playClip: function(model, name, opts) {
    return playClip(model, name, opts);
  },

  loadAndBuild: function(url, callback) {
    this.load(url, function(err, mdl) {
      if (err) { callback(err, null); return; }
      try {
        var result = buildModel(mdl);
        callback(null, result);
      } catch (e) {
        callback(e, null);
      }
    });
  }
});
