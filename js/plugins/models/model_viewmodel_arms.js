var plugin = include('registry');

plugin.register({
  id: 'model_viewmodel_arms',
  name: 'View Model Kollari',
  type: 'model',
  version: '3.0',
  description: 'FP kollari — omuz/dirsek/bilek eklemli, bagimsiz animasyon',
  enabled: true,

  subModels: [
    { id: 'default', name: 'Default Duruş', desc: 'Iki elle tutus — sol ileri, sag geri', viewmodel: true },
    { id: 'pistol', name: 'Pistol Duruşu', desc: 'Sag kol ileri, silah pozisyonu', viewmodel: true },
    { id: 'knife', name: 'Bıçak Duruşu', desc: 'Sag kol ileri, sol geride', viewmodel: true },
    { id: 'fist', name: 'Yumruk Duruşu', desc: 'Iki kol yumruk seviyesinde', viewmodel: true }
  ],

  createModel() {
    return this.createSubModel('default');
  },

  animations: {
    equip: {
      duration: 1.5,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.y', keys: [-0.5, -0.35, -0.12, 0.03, 0] },
        { pivot: '__self__', prop: 'position.z', keys: [0.3, 0.22, 0.1, 0.02, 0] },
        { pivot: '__self__', prop: 'rotation.x', keys: [0.4, 0.25, 0.08, 0.02, 0] }
      ]
    }
  },

  createSubModel(id) {
    var result = this.createArms();
    result.group.name = 'arms_' + id;
    if (result.setPose) result.setPose(id);
    return result.group;
  },

  _poses: {
    default: {
      lSh: [-0.07, -0.04,  0.01],  // Sol omuz X/sag-sol  Y/yukari-asagi  Z/ekrana yakin-uzak
      lEl: [-0.14, -0.03, -0.02],  // Sol dirsek
      lHa: [-0.02, -0.01, -0.14],  // Sol el
      rSh: [ 0.07, -0.04,  0.01],  // Sag omuz
      rEl: [ 0.14, -0.03, -0.02],  // Sag dirsek
      rHa: [ 0.02, -0.01, -0.14],  // Sag el
      wp:  [ 0.02, -0.01, -0.14],  // Silah slotu
      lXU: -0.04,  lYU: 1.0,         // Sol kol X/Y olcek
      rXU: 1.0,  rYU: 1.0          // Sag kol X/Y olcek
    },
    pistol: {
      lSh: [-0.10, -0.1,  0.04],  // Sol omuz X/sag-sol  Y/yukari-asagi  Z/ekrana yakin-uzak
      lEl: [-0.14, -0.07, -0.01],  // Sol dirsek X/sag-sol  Y/yukari-asagi  Z/ekrana yakin-uzak
      lHa: [-0.01, -0.08, -0.18],  // Sol el    X/sag-sol  Y/yukari-asagi  Z/ekrana yakin-uzak
      rSh: [ 0.02, -0.08,  0.03],  // Sag omuz   X/sag-sol  Y/yukari-asagi  Z/ekrana yakin-uzak
      rEl: [ 0.00, -0.04, -0.10],  // Sag dirsek X/sag-sol  Y/yukari-asagi  Z/ekrana yakin-uzak
      rHa: [ 0.00, -0.018260, -0.2],  // Sag el     X/sag-sol  Y/yukari-asagi  Z/ekrana yakin-uzak
      wp:  [ 0.00, -0.04, -0.10],  // Silah slotu X/sag-sol  Y/yukari-asagi  Z/ekrana yakin-uzak
      lXU: 1.0,  lYU: 1.0,         // Sol kol X/Y olcek carpani
      rXU: 1.0,  rYU: 1.5          // Sag kol X/Y olcek carpani
    },
    knife: {
      lSh: [-0.22, -0.08,  0.06],  // Sol omuz
      lEl: [-0.34, -0.03,  0.02],  // Sol dirsek
      lHa: [-0.20, -0.02, -0.06],  // Sol el
      rSh: [ 0.10, -0.08,  0.06],  // Sag omuz
      rEl: [ 0.16, -0.03,  0.02],  // Sag dirsek
      rHa: [ 0.03, -0.01, -0.06],  // Sag el
      wp:  [ 0.03, -0.01, -0.06],  // Silah slotu
      lXU: 1.0,  lYU: 1.0,         // Sol kol X/Y olcek
      rXU: 1.0,  rYU: 1.0          // Sag kol X/Y olcek
    },
    fist: {
      lSh: [-0.315, -0.04,  0.02],  // Sol omuz
      lEl: [-0.44,   0.02, -0.05],  // Sol dirsek
      lHa: [-0.42,   0.03, -0.20],  // Sol el
      rSh: [ 0.045, -0.04,  0.02],  // Sag omuz
      rEl: [ 0.115,  0.02, -0.05],  // Sag dirsek
      rHa: [ 0.08,   0.03, -0.20],  // Sag el
      wp:  [ 0.08,   0.03, -0.20],  // Silah slotu
      lXU: 0.95, lYU: 1.0,          // Sol kol X/Y olcek
      rXU: 1.0,  rYU: 1.0           // Sag kol X/Y olcek
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

    // === SOL KOL HIYERARSISI ===
    var leftArm = new THREE.Group();
    leftArm.name = 'left_arm';
    var lElbowPivot = new THREE.Object3D();
    lElbowPivot.name = 'left_elbow';
    leftArm.add(lElbowPivot);
    var lWristPivot = new THREE.Object3D();
    lWristPivot.name = 'left_wrist';
    lElbowPivot.add(lWristPivot);

    // === SAG KOL HIYERARSISI ===
    var rightArm = new THREE.Group();
    rightArm.name = 'right_arm';
    var rElbowPivot = new THREE.Object3D();
    rElbowPivot.name = 'right_elbow';
    rightArm.add(rElbowPivot);
    var rWristPivot = new THREE.Object3D();
    rWristPivot.name = 'right_wrist';
    rElbowPivot.add(rWristPivot);

    // Silah slotu — ana modelde, durus bazli wp koordinatlari dogrudan uygulanir
    var slot = new THREE.Object3D();
    slot.name = 'fp_weapon_slot';
    g.add(slot);

    g.add(leftArm);
    g.add(rightArm);

    var refs = {
      sleeveMat: sleeveMat, skinMat: skinMat,
      leftArm: leftArm, rightArm: rightArm,
      lElbowPivot: lElbowPivot, rElbowPivot: rElbowPivot,
      lWristPivot: lWristPivot, rWristPivot: rWristPivot,
      slot: slot,
      lUpper: null, lElbowSphere: null, lForearm: null, lHand: null,
      rUpper: null, rElbowSphere: null, rForearm: null, rHand: null
    };

    function disposeMesh(m) {
      if (m) {
        if (m.geometry) m.geometry.dispose();
        if (m.material && !m.material._cacheKey) m.material.dispose();
        if (m.parent) m.parent.remove(m);
      }
    }

    return {
      group: g,
      slot: slot,
      leftGroup: leftArm,
      rightGroup: rightArm,

      setPose: function(poseName) {
        var pose;
        if (poseName && typeof poseName === 'object') {
          var basePose = self._poses[poseName.base || 'default'] || self._poses.default;
          pose = Object.assign({}, basePose, poseName);
        } else {
          pose = self._poses[poseName] || self._poses.default;
        }
        var lXU = pose.lXU || 1.0, lYU = pose.lYU || 1.0;
        var rXU = pose.rXU || 1.0, rYU = pose.rYU || 1.0;
        var svL = function(a) { return new THREE.Vector3(a[0] * lXU, a[1] * lYU, a[2]); };
        var svR = function(a) { return new THREE.Vector3(a[0] * rXU, a[1] * rYU, a[2]); };

        // -- SOL KOL --
        disposeMesh(refs.lUpper);
        disposeMesh(refs.lElbowSphere);
        disposeMesh(refs.lForearm);
        disposeMesh(refs.lHand);
        refs.lUpper = null;
        refs.lElbowSphere = null;
        refs.lForearm = null;
        refs.lHand = null;

        if (pose.lSh) {
          leftArm.position.copy(svL(pose.lSh));
          var lElLocal = svL(pose.lEl).sub(svL(pose.lSh));
          var lHaDir = svL(pose.lHa).sub(svL(pose.lEl));
          var lFwd = new THREE.Vector3(0, 0, 1);

          refs.lUpper = self._tube(new THREE.Vector3(0, 0, 0), lElLocal, 0.022, sleeveMat);
          refs.lUpper.name = 'left_upper';
          leftArm.add(refs.lUpper);

          refs.lElbowSphere = self._sphere([0, 0, 0], 0.022, sleeveMat);
          refs.lElbowSphere.name = 'left_elbow_sphere';
          lElbowPivot.add(refs.lElbowSphere);

          lElbowPivot.position.copy(lElLocal);

          var lFLen = lHaDir.length();
          if (lFLen < 0.001) lFLen = 0.001;
          lFwd.copy(lHaDir).normalize();
          lElbowPivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), lFwd);

          refs.lForearm = self._tube(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, lFLen), 0.02, sleeveMat);
          refs.lForearm.name = 'left_forearm';
          lElbowPivot.add(refs.lForearm);

          lWristPivot.position.set(0, 0, lFLen);

          refs.lHand = self._sphere([0, 0, 0], 0.028, skinMat);
          refs.lHand.name = 'left_hand';
          lWristPivot.add(refs.lHand);
        }

        // -- SAG KOL --
        disposeMesh(refs.rUpper);
        disposeMesh(refs.rElbowSphere);
        disposeMesh(refs.rForearm);
        disposeMesh(refs.rHand);

        rightArm.position.copy(svR(pose.rSh));
        var rElLocal = svR(pose.rEl).sub(svR(pose.rSh));
        var rHaDir = svR(pose.rHa).sub(svR(pose.rEl));
        var rFwd = new THREE.Vector3(0, 0, 1);

        refs.rUpper = self._tube(new THREE.Vector3(0, 0, 0), rElLocal, 0.022, sleeveMat);
        refs.rUpper.name = 'right_upper';
        rightArm.add(refs.rUpper);

        refs.rElbowSphere = self._sphere([0, 0, 0], 0.022, sleeveMat);
        refs.rElbowSphere.name = 'right_elbow_sphere';
        rElbowPivot.add(refs.rElbowSphere);

        rElbowPivot.position.copy(rElLocal);

        var rFLen = rHaDir.length();
        if (rFLen < 0.001) rFLen = 0.001;
        rFwd.copy(rHaDir).normalize();
        rElbowPivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), rFwd);

        refs.rForearm = self._tube(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, rFLen), 0.02, sleeveMat);
        refs.rForearm.name = 'right_forearm';
        rElbowPivot.add(refs.rForearm);

        rWristPivot.position.set(0, 0, rFLen);

        refs.rHand = self._sphere([0, 0, 0], 0.028, skinMat);
        refs.rHand.name = 'right_hand';
        rWristPivot.add(refs.rHand);

        if (pose.wp) refs.slot.position.set(pose.wp[0], pose.wp[1], pose.wp[2]);
      }
    };
  }
});
