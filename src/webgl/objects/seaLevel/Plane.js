import * as THREE from "three";

export class Plane {
  constructor() {
    this.mesh = null;
    this.width = 100;
    this.height = 100;
    this.widthSegments = 32;
    this.heightSegments = 32;

    this.init();
  }

  init() {
    const geometry = new THREE.PlaneGeometry(
      this.width,
      this.height,
      this.widthSegments,
      this.heightSegments
    );
    const material = new THREE.ShaderMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotateX(Math.PI / 2)
    this.mesh.position.x = -60;
    this.mesh.position.z = 70;
    this.mesh.position.y = -4;
  }

  update() {
  }

  getMesh() {
    return this.mesh;
  }
}
