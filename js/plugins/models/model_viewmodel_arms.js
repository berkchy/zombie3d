var plugin = include('registry');

plugin.register({
  id: 'model_viewmodel_arms',
  name: 'View Model Kolları',
  type: 'model',
  version: '1.0',
  description: 'FP kollari — dirsekli silindirik, pistol/knife/default duruşları',
  enabled: true,

  _poses: {
    default: {
      lSh: [-0.07, -0.04, 0.01], lEl: [-0.14, -0.03, -0.02], lHa: [-0.02, -0.01, -0.14],
      rSh: [0.07, -0.04, 0.01], rEl: [0.14, -0.03, -0.02], rHa: [0.02, -0.01, -0.14],
      wp: [0.02, -0.01, -0.14]
    },
    pistol: {
      rSh: [0.04, -0.06, 0.05], rEl: [0.035, -0.04, -0.08], rHa: [0.01, -0.02, -0.18],
      wp: [0.01, 0.015, -0.11]
    },
    knife: {
      lSh: [-0.22, -0.08, 0.06], lEl: [-0.34, -0.03, 0.02], lHa: [-0.20, -0.02, -0.06],
      rSh: [0.10, -0.08, 0.06], rEl: [0.16, -0.03, 0.02], rHa: [0.03, -0.01, -0.06],
      wp: [0.03, -0.01, -0.06]
    }
  },

  _tube: function(start, end, radius, mat) {
    var dir = new THREE.Vector3().copy(end).sub(start);
    var len = dir.length();
    if (len < 0.001) len = 0.001;
    dir.normalize();
    var geo = new THREE.CylinderGeometry(radius, radius, len, 6);
    var m = new THREE.Mesh(geo, mat);
    m.position.copy(start).add(end).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return m;
  },

  _sphere: function(pos, radius, mat) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(radius, 6, 6), mat);
    m.position.set(pos[0], pos[1], pos[2]);
    return m;
  },

  createArms: function() {
    var sleeveMat = new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.6 });
    var skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.7 });
    var self = this;
    var sv = function(a) { return new THREE.Vector3(a[0], a[1], a[2]); };

    var g = new THREE.Group();
    var p = this._poses.default;

    // Sol kol
    var lArm = this._tube(sv(p.lSh), sv(p.lEl), 0.022, sleeveMat);
    g.add(lArm);
    var lElbow = this._sphere(p.lEl, 0.022, sleeveMat);
    g.add(lElbow);
    var lForearm = this._tube(sv(p.lEl), sv(p.lHa), 0.02, sleeveMat);
    g.add(lForearm);
    var lHand = this._sphere(p.lHa, 0.028, skinMat);
    g.add(lHand);

    // Sag kol
    var rArm = this._tube(sv(p.rSh), sv(p.rEl), 0.022, sleeveMat);
    g.add(rArm);
    var rElbow = this._sphere(p.rEl, 0.022, sleeveMat);
    g.add(rElbow);
    var rForearm = this._tube(sv(p.rEl), sv(p.rHa), 0.02, sleeveMat);
    g.add(rForearm);
    var rHand = this._sphere(p.rHa, 0.028, skinMat);
    g.add(rHand);

    // Silah slotu
    var slot = new THREE.Object3D();
    slot.position.copy(sv(p.wp));
    slot.name = 'fp_weapon_slot';
    g.add(slot);

    var refs = {
      lArm: lArm, lElbow: lElbow, lForearm: lForearm, lHand: lHand,
      rArm: rArm, rElbow: rElbow, rForearm: rForearm, rHand: rHand,
      slot: slot, sleeveMat: sleeveMat, skinMat: skinMat
    };

    return {
      group: g,
      slot: slot,
      setPose: function(poseName) {
        var pose = self._poses[poseName] || self._poses.default;
        var sv2 = function(a) { return new THREE.Vector3(a[0], a[1], a[2]); };

        var ut = function(tube, start, end, radius) {
          if (!tube || !start || !end) return;
          var dir = sv2(end).sub(sv2(start));
          var len = dir.length(); if (len < 0.001) len = 0.001;
          dir.normalize();
          tube.position.copy(sv2(start)).add(sv2(end)).multiplyScalar(0.5);
          tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          var ng = new THREE.CylinderGeometry(radius, radius, len, 6);
          if (tube.geometry) { tube.geometry.dispose(); }
          tube.geometry = ng;
          tube.visible = true;
        };
        var us = function(sph, pos) {
          if (!sph || !pos) return;
          sph.position.set(pos[0], pos[1], pos[2]);
          sph.visible = true;
        };
        var hideAll = function(arr) {
          for (var i = 0; i < arr.length; i++) { if (arr[i]) arr[i].visible = false; }
        };

        // Sol kol
        if (pose.lSh) {
          ut(refs.lArm, pose.lSh, pose.lEl, 0.022);
          us(refs.lElbow, pose.lEl);
          ut(refs.lForearm, pose.lEl, pose.lHa, 0.02);
          us(refs.lHand, pose.lHa);
        } else {
          hideAll([refs.lArm, refs.lElbow, refs.lForearm, refs.lHand]);
        }

        // Sag kol (her zaman gorunur)
        ut(refs.rArm, pose.rSh, pose.rEl, 0.022);
        us(refs.rElbow, pose.rEl);
        ut(refs.rForearm, pose.rEl, pose.rHa, 0.02);
        us(refs.rHand, pose.rHa);

        // Slot
        if (pose.wp) refs.slot.position.set(pose.wp[0], pose.wp[1], pose.wp[2]);
      }
    };
  }
});
