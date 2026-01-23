import * as THREE from "three";

export class Camera {
  constructor() {
    this.instance = null;
    this.init();
  }

  init() {
    // PerspectiveCamera (fov, aspect, near, far)
    this.instance = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.instance.position.set(0, 0, 5);
  }

  resize() {
    this.instance.aspect = window.innerWidth / window.innerHeight;
    this.instance.updateProjectionMatrix();
  }

  update() {

  }
}
