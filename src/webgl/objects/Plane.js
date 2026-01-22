import * as THREE from "three";

export class Plane {
  constructor(width = 2, height = 2, widthSegments = 32, heightSegments = 32) {
    this.mesh = null;
    this.width = width;
    this.height = height;
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;

    this.init();
  }

  init() {
    const geometry = new THREE.PlaneGeometry(
      this.width,
      this.height,
      this.widthSegments,
      this.heightSegments
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geometry, material);
  }

  update() {
    if (this.mesh) {
      this.mesh.rotation.x += 0.01;
      this.mesh.rotation.y += 0.01;
    }
  }

  getMesh() {
    return this.mesh;
  }
}
