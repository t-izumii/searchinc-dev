import * as THREE from "three";
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export class SkyObject {
  constructor() {
    this.init();
  }

  init() {
    this.mesh = new Sky();
    this.mesh.scale.setScalar(1000);

    const uniforms = this.mesh.material.uniforms;
    uniforms['turbidity'].value = 2;
    uniforms['rayleigh'].value = 1;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;

    // 太陽の位置（必須）
    const sun = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(90);  // 高度
    const theta = THREE.MathUtils.degToRad(-135);     // 方角
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);
  }

  update(time) {
    // if (this.mesh && this.mesh.material.uniforms["time"]) {
    //   this.mesh.material.uniforms["time"].value = time * 0.1;
    // }
  }

  getMesh() {
    return this.mesh;
  }
}
