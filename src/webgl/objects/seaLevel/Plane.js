import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

export class Plane {
  constructor() {
    this.mesh = null;
    this.width = 100;
    this.height = 100;

    this.init();
  }

  init() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height);

    this.mesh = new Water(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "/textures/waternormals.png",
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(1, 1, 1).normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001133,
      distortionScale: 3.7,
      fog: false,
    });

    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(-60, -1, 70);
  }

  update(time) {
    if (this.mesh && this.mesh.material.uniforms["time"]) {
      this.mesh.material.uniforms["time"].value = time * 0.1;
    }
  }

  getMesh() {
    return this.mesh;
  }

  // パラメータ調整用メソッド
  setWaterColor(color) {
    this.mesh.material.uniforms["waterColor"].value.set(color);
  }

  setDistortionScale(scale) {
    this.mesh.material.uniforms["distortionScale"].value = scale;
  }

  setSunDirection(x, y, z) {
    this.mesh.material.uniforms["sunDirection"].value.set(x, y, z).normalize();
  }
}
