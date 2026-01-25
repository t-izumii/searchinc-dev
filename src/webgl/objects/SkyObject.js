import * as THREE from "three";
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export class SkyObject {
  constructor() {
    this.init();
  }

  init() {
    this.mesh = new Sky();
    this.mesh.scale.setScalar(40000);

    const uniforms = this.mesh.material.uniforms;
    uniforms['turbidity'].value = 1;
    uniforms['rayleigh'].value = 1;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;

    // 太陽の位置（必須）
    const sun = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(90);
    const theta = THREE.MathUtils.degToRad(-135);
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);
  }

  update() {
  }

  getMesh() {
    return this.mesh;
  }
}
