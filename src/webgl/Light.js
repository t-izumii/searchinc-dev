import * as THREE from "three";

export class Light {
  constructor(scene) {
    this.scene = scene;
    this.ambientLight = null;
    this.directionalLight = null;
    this.init();
  }

  init() {
    // 環境光
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    // 平行光源
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(1, 1, 1);
    this.scene.add(this.directionalLight);
  }

  update() {

  }
}
