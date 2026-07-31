#!/usr/bin/env node
/*
 * mdl_info.js - GoldSrc (.mdl) model detay cikarici
 * Kullanim: node tools/mdl_info.js assets/models/v_ak47.mdl
 * Yeni bir silah modeli eklerken once bu tool'u calistirip
 * geometry boyutlari, animasyon adlari ve onerilen olcegi alin.
 */
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Kullanim: node tools/mdl_info.js <dosya.mdl>');
  process.exit(1);
}

const buf = fs.readFileSync(file);
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

function u32(o) { return dv.getUint32(o, true); }
function i32(o) { return dv.getInt32(o, true); }
function f32(o) { return dv.getFloat32(o, true); }
function i16(o) { return dv.getInt16(o, true); }
function str(o, n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const c = dv.getUint8(o + i);
    if (!c) break;
    s += String.fromCharCode(c);
  }
  return s;
}
function vec3(o) { return [f32(o), f32(o + 4), f32(o + 8)]; }
function fmt(v) { return v.map(x => Number(x.toFixed(3))); }

// ---------- HEADER (GoldSrc studio v10, model_mdl.js ile birebir) ----------
const id = u32(0);
const version = u32(4);
const hName = str(8, 64);
const hLen = u32(72);
const eye = fmt(vec3(76));
const min = fmt(vec3(88));
const max = fmt(vec3(100));
const bbmin = fmt(vec3(112));
const bbmax = fmt(vec3(124));
const flags = u32(136);

const F = (o) => ({
  numbones: u32(o), boneindex: u32(o + 4),
  numbonecontrollers: u32(o + 8), bonecontrollerindex: u32(o + 12),
  numhitboxes: u32(o + 16), hitboxindex: u32(o + 20),
  numseq: u32(o + 24), seqindex: u32(o + 28),
  numseqgroups: u32(o + 32), seqgroupindex: u32(o + 36),
  numtextures: u32(o + 40), textureindex: u32(o + 44), texturedataindex: u32(o + 48),
  numskinref: u32(o + 52), numskinfamilies: u32(o + 56), skinindex: u32(o + 60),
  numbodyparts: u32(o + 64), bodypartindex: u32(o + 68),
  numattachments: u32(o + 72), attachmentindex: u32(o + 76)
});
const h = F(140);

console.log('==============================================');
console.log('MDL BILGI  |  ' + file);
console.log('==============================================');
if (id !== 0x54534449) { console.error('HATA: IDST imzasi yok, mdl degil.'); process.exit(1); }
if (version !== 10) { console.error('HATA: Desteklenmeyen versiyon: ' + version); process.exit(1); }
console.log('ident:      ' + str(0, 4) + ' / versiyon: ' + version);
console.log('isim:       ' + hName);
console.log('boyut:      ' + hLen + ' bayt');
console.log('eye pos:    ' + eye);
console.log('bbox min:   ' + min);
console.log('bbox max:   ' + max);
console.log('bbmin:      ' + bbmin);
console.log('bbmax:      ' + bbmax);
console.log('flags:      ' + flags);
console.log('');

// ---------- BONES ----------
console.log('--- BONELAR (' + h.numbones + ') ---');
const bones = [];
for (let i = 0; i < h.numbones; i++) {
  const bo = h.boneindex + i * 112;
  const b = {
    name: str(bo, 32),
    parent: i32(bo + 32),
    flags: u32(bo + 36),
    pos: fmt(vec3(bo + 76)),
    rot: fmt(vec3(bo + 88))
  };
  bones.push(b);
}
const children = new Map();
for (const b of bones) {
  if (!children.has(b.parent)) children.set(b.parent, []);
  children.get(b.parent).push(b.name);
}
function printBone(name, depth, seen) {
  const bi = bones.findIndex(b => b.name === name);
  console.log('  '.repeat(depth) + name +
    '  pos[' + bones[bi].pos.join(', ') + ']  rot[' + bones[bi].rot.join(', ') + ']');
  for (const c of children.get(bi) || []) printBone(c, depth + 1, seen);
}
for (let i = 0; i < bones.length; i++) {
  if (bones[i].parent === -1) printBone(bones[i].name, 0, new Set());
}
console.log('');

// ---------- ATTACHMENTS ----------
console.log('--- EK NOKTALARI (attachments) ---');
for (let i = 0; i < h.numattachments; i++) {
  const ao = h.attachmentindex + i * 88;
  const a = {
    name: str(ao, 32),
    type: u32(ao + 32),
    bone: u32(ao + 36),
    org: fmt(vec3(ao + 40))
  };
  console.log('  ' + a.name + '  bone=' + a.bone + ' (' + (bones[a.bone] ? bones[a.bone].name : '?') + ')  org=' + a.org);
}
if (h.numattachments === 0) console.log('  (yok)');
console.log('');

// ---------- SEQUENCES / ANIMASYONLAR ----------
console.log('--- ANIMASYONLAR (' + h.numseq + ') ---');
const seqs = [];
for (let i = 0; i < h.numseq; i++) {
  const so = h.seqindex + i * 176;
  const s = {
    label: str(so, 32),
    fps: f32(so + 32),
    flags: u32(so + 36),
    activity: u32(so + 40),
    actweight: u32(so + 44),
    numevents: u32(so + 48),
    numframes: u32(so + 56),
    motiontype: u32(so + 68),
    motionbone: u32(so + 72),
    numblends: u32(so + 120),
    animindex: u32(so + 124),
    seqgroup: i32(so + 156)
  };
  seqs.push(s);
}
for (const s of seqs) {
  console.log('  ' + s.label.padEnd(20) +
    ' fps=' + s.fps +
    ' frame=' + s.numframes +
    ' grp=' + s.seqgroup +
    ' dur=' + (s.numframes > 0 && s.fps > 0 ? (s.numframes / s.fps).toFixed(2) + 's' : '-'));
}

function guessRole(label) {
  const l = label.toLowerCase();
  if (/idle|wait|stand/i.test(l)) return 'idle (clip1)';
  if (/draw|deploy|raise|pull/i.test(l)) return 'draw';
  if (/reload|rechg/i.test(l)) return 'reload';
  if (/shoot|fire|attack/i.test(l)) return 'shoot';
  return '?';
}
console.log('');
console.log('  -> Clip esleme onerisi:');
for (const s of seqs) console.log('     ' + s.label + ' => ' + guessRole(s.label));
console.log('');

// ---------- TEXTURELAR ----------
console.log('--- TEXTURELAR (' + h.numtextures + ') ---');
for (let i = 0; i < h.numtextures; i++) {
  const to = h.textureindex + i * 80;
  const t = {
    name: str(to, 64),
    flags: u32(to + 64),
    width: u32(to + 68),
    height: u32(to + 72),
    index: u32(to + 76)
  };
  console.log('  ' + t.name.padEnd(30) + ' ' + t.width + 'x' + t.height);
}
console.log('');

// ---------- BODYPART / GEOMETRI ----------
console.log('--- GEOMETRI SINIRLARI ---');
let gmin = [Infinity, Infinity, Infinity];
let gmax = [-Infinity, -Infinity, -Infinity];
let totalVerts = 0;
for (let b = 0; b < h.numbodyparts; b++) {
  const bp = h.bodypartindex + b * 76;
  const bpName = str(bp, 64);
  const nummodels = u32(bp + 64);
  const modelindex = u32(bp + 72);
  for (let m = 0; m < nummodels; m++) {
    const mo = modelindex + m * 112;
    const mName = str(mo, 64);
    const nummesh = u32(mo + 72);
    const numverts = u32(mo + 80);
    const vertindex = u32(mo + 88);
    const mmin = [Infinity, Infinity, Infinity];
    const mmax = [-Infinity, -Infinity, -Infinity];
    for (let v = 0; v < numverts; v++) {
      const x = f32(vertindex + v * 12);
      const y = f32(vertindex + v * 12 + 4);
      const z = f32(vertindex + v * 12 + 8);
      for (let a = 0; a < 3; a++) {
        const c = [x, y, z][a];
        if (c < mmin[a]) mmin[a] = c;
        if (c > mmax[a]) mmax[a] = c;
        if (c < gmin[a]) gmin[a] = c;
        if (c > gmax[a]) gmax[a] = c;
      }
    }
    totalVerts += numverts;
    const msz = [mmax[0] - mmin[0], mmax[1] - mmin[1], mmax[2] - mmin[2]];
    console.log('  ' + bpName + ' / ' + mName);
    console.log('    mesh=' + nummesh + '  verts=' + numverts +
      '  MIN=' + fmt(mmin) + '  MAX=' + fmt(mmax) +
      '  SIZE=' + fmt(msz));
  }
}
const gsz = [gmax[0] - gmin[0], gmax[1] - gmin[1], gmax[2] - gmin[2]];
console.log('  TOPLAM:');
console.log('    verts=' + totalVerts +
  '  MIN=' + fmt(gmin) + '  MAX=' + fmt(gmax) + '  SIZE=' + fmt(gsz));
console.log('');

// ---------- ONERILER ----------
const len = gsz[2]; // HL +Z = namlu yonu (boneGroup rotasyonundan sonra Three +Y olur)
const drop = -gmin[1]; // HL Y asagi sarkma (gorunum modelinde govdenin asagida durmasi)
const above = gmax[1];
console.log('--- OLCULER (HL birim) ---');
console.log('  uzunluk (namlu-dipcik): ' + len.toFixed(1) + '  (barrel sonu +' + gmax[2].toFixed(1) + ' / dipcik ' + gmin[2].toFixed(1) + ')');
console.log('  yukseklik (asagi):      ' + drop.toFixed(1));
console.log('  yukseklik (yukari):     ' + above.toFixed(1));
console.log('  genislik:               ' + gsz[0].toFixed(1));
console.log('');

console.log('--- FIRST-PERSON ONERILERI ---');
console.log('  setModelRef icin (weapon_ak47.js ile ayni mantik):');
console.log('    model.rotation.set(-Math.PI/2, Math.PI, 0);  // order YXZ - namlu ileri, dik');
console.log('    model.scale.set(S, S, S);  // S asagida');
console.log('    model.position.set(0, 0, 0);');
console.log('  Onerilen olcek S (dipcigin kameraya girmemesi icin, slot z=-0.42):');
console.log('    S < ' + (0.42 / (-gmin[2] || 1)).toFixed(4) + '  (dipcik kameraya carpmasin)');
console.log('    Ornek baslangic degeri: ' + (0.08).toFixed(2) + ' - ekranda buyukluk ayarlamasi gerekir.');
console.log('');
console.log('  Animasyon clip adlari yukarida; weapon icinde _playClip(name) cagir:');
console.log('    clip1 (idle), draw, reload, shoot1/2/3 gibi roleMap ile esle. "clip1" her zaman idle.');
console.log('==============================================');
