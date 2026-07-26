var plugin = include('registry');

plugin.register({
  id: 'model_knife',
  name: 'Bıçak',
  type: 'model',
  version: '3.0',
  description: 'Gelişmiş taktik bıçak — çift taraflı bileyleme, dolgu kanalı, konturlu kabza',
  enabled: true,

  _materials: null,

  _initMaterials() {
    if (this._materials) return;
    this._materials = {
      blade: new THREE.MeshStandardMaterial({
        color: 0xc8d0d8,
        metalness: 0.92,
        roughness: 0.06
      }),
      bladeEdge: new THREE.MeshStandardMaterial({
        color: 0xb0b8c0,
        metalness: 0.95,
        roughness: 0.03
      }),
      fuller: new THREE.MeshStandardMaterial({
        color: 0x889098,
        metalness: 0.85,
        roughness: 0.2
      }),
      guard: new THREE.MeshStandardMaterial({
        color: 0x606870,
        metalness: 0.7,
        roughness: 0.25
      }),
      handle: new THREE.MeshStandardMaterial({
        color: 0x1a1a22,
        roughness: 0.9,
        metalness: 0.0
      }),
      handleGrip: new THREE.MeshStandardMaterial({
        color: 0x22222e,
        roughness: 0.95,
        metalness: 0.0
      }),
      pommel: new THREE.MeshStandardMaterial({
        color: 0x505860,
        metalness: 0.65,
        roughness: 0.3
      }),
      rivet: new THREE.MeshStandardMaterial({
        color: 0x606870,
        metalness: 0.8,
        roughness: 0.2
      })
    };
  },

  createModel() {
    this._initMaterials();
    var M = this._materials;
    var group = new THREE.Group();

    var bladeShape = new THREE.Shape();
    bladeShape.moveTo(-0.022, 0);
    bladeShape.lineTo(-0.018, 0.02);
    bladeShape.lineTo(-0.016, 0.06);
    bladeShape.lineTo(-0.012, 0.10);
    bladeShape.lineTo(-0.007, 0.14);
    bladeShape.lineTo(0, 0.175);
    bladeShape.lineTo(0.007, 0.14);
    bladeShape.lineTo(0.012, 0.10);
    bladeShape.lineTo(0.016, 0.06);
    bladeShape.lineTo(0.018, 0.02);
    bladeShape.lineTo(0.022, 0);
    bladeShape.closePath();

    var bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.008,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      bevelSegments: 3
    });
    bladeGeo.translate(0, 0, -0.004);

    var blade = new THREE.Mesh(bladeGeo, M.blade);
    blade.rotation.x = Math.PI / 2;
    blade.position.set(0, -0.003, 0.04);
    blade.name = 'blade';
    group.add(blade);

    var edgeShape = new THREE.Shape();
    edgeShape.moveTo(-0.024, 0);
    edgeShape.lineTo(-0.022, 0.002);
    edgeShape.lineTo(-0.016, 0.002);
    edgeShape.lineTo(-0.008, 0.075);
    edgeShape.lineTo(0, 0.09);
    edgeShape.lineTo(0.008, 0.075);
    edgeShape.lineTo(0.016, 0.002);
    edgeShape.lineTo(0.022, 0.002);
    edgeShape.lineTo(0.024, 0);
    edgeShape.lineTo(0.022, -0.002);
    edgeShape.lineTo(0.016, -0.002);
    edgeShape.lineTo(0.008, -0.075);
    edgeShape.lineTo(0, -0.09);
    edgeShape.lineTo(-0.008, -0.075);
    edgeShape.lineTo(-0.016, -0.002);
    edgeShape.lineTo(-0.022, -0.002);
    edgeShape.closePath();

    var edgeGeo = new THREE.ExtrudeGeometry(edgeShape, {
      depth: 0.01,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: 0.001,
      bevelSegments: 2
    });
    edgeGeo.translate(0, 0, -0.005);

    var edge = new THREE.Mesh(edgeGeo, M.bladeEdge);
    edge.rotation.x = Math.PI / 2;
    edge.position.set(0, -0.003, 0.04);
    edge.name = 'blade_edge';
    group.add(edge);

    var fullerShape = new THREE.Shape();
    fullerShape.moveTo(-0.005, 0);
    fullerShape.lineTo(-0.004, 0.02);
    fullerShape.lineTo(-0.003, 0.06);
    fullerShape.lineTo(-0.001, 0.09);
    fullerShape.lineTo(0, 0.095);
    fullerShape.lineTo(0.001, 0.09);
    fullerShape.lineTo(0.003, 0.06);
    fullerShape.lineTo(0.004, 0.02);
    fullerShape.lineTo(0.005, 0);
    fullerShape.lineTo(0.004, -0.02);
    fullerShape.lineTo(0.003, -0.06);
    fullerShape.lineTo(0.001, -0.09);
    fullerShape.lineTo(0, -0.095);
    fullerShape.lineTo(-0.001, -0.09);
    fullerShape.lineTo(-0.003, -0.06);
    fullerShape.lineTo(-0.004, -0.02);
    fullerShape.closePath();

    var fullerGeo = new THREE.ExtrudeGeometry(fullerShape, {
      depth: 0.012,
      bevelEnabled: false
    });
    fullerGeo.translate(0, 0, -0.006);

    var fuller = new THREE.Mesh(fullerGeo, M.fuller);
    fuller.rotation.x = Math.PI / 2;
    fuller.position.set(0, -0.002, 0.065);
    fuller.name = 'fuller';
    group.add(fuller);

    var guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.018, 0.014),
      M.guard
    );
    guard.position.set(0, 0, 0.032);
    guard.name = 'guard';
    group.add(guard);

    var guardBevel = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.012, 0.016),
      M.guard
    );
    guardBevel.position.set(0, 0, 0.032);
    guardBevel.name = 'guard_bevel';
    group.add(guardBevel);

    var handleCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.026, 0.09),
      M.handleGrip
    );
    handleCore.position.set(0, 0, -0.015);
    handleCore.name = 'handle_core';
    group.add(handleCore);

    var handleFront = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.03, 8),
      M.handle
    );
    handleFront.rotation.x = Math.PI / 2;
    handleFront.position.set(0, 0, 0.015);
    handleFront.name = 'handle_front';
    group.add(handleFront);

    var handleRear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.016, 0.03, 8),
      M.handle
    );
    handleRear.rotation.x = Math.PI / 2;
    handleRear.position.set(0, 0, -0.045);
    handleRear.name = 'handle_rear';
    group.add(handleRear);

    var handleMid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.025, 8),
      M.handleGrip
    );
    handleMid.rotation.x = Math.PI / 2;
    handleMid.position.set(0, 0, -0.075);
    handleMid.name = 'handle_mid';
    group.add(handleMid);

    var handleBump = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 6, 6),
      M.handleGrip
    );
    handleBump.scale.set(1.5, 1.0, 0.8);
    handleBump.position.set(0, 0, -0.095);
    handleBump.name = 'handle_bump';
    group.add(handleBump);

    for (var side = -1; side <= 1; side += 2) {
      for (var j = 0; j < 3; j++) {
        var rivet = new THREE.Mesh(
          new THREE.CylinderGeometry(0.003, 0.003, 0.004, 6),
          M.rivet
        );
        rivet.rotation.x = Math.PI / 2;
        rivet.position.set(side * 0.014, 0, -0.025 - j * 0.025);
        rivet.name = 'rivet_' + (side > 0 ? 'r' : 'l') + '_' + j;
        group.add(rivet);
      }
    }

    var pommel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.006, 8),
      M.pommel
    );
    pommel.rotation.x = Math.PI / 2;
    pommel.position.set(0, 0, -0.098);
    pommel.name = 'pommel';
    group.add(pommel);

    var tip = new THREE.Object3D();
    tip.position.set(0, 0, 0.215);
    tip.name = 'barrel_tip';
    group.add(tip);

    return group;
  },

  animations: {
    equip: {
      duration: 1.5,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'position.y', keys: [-0.5, -0.3, -0.05, 0.05, 0] },
        { pivot: '__self__', prop: 'position.z', keys: [0.25, 0.2, 0.08, 0.02, 0] },
        { pivot: '__self__', prop: 'rotation.z', keys: [0.2, -0.1, 0.05, -0.02, 0] }
      ]
    },
    fire: {
      duration: 1.0,
      loop: false,
      tracks: [
        { pivot: '__self__', prop: 'rotation.z', keys: [0, -0.01, 0.03, -0.01, 0] }
      ]
    }
  }
});
