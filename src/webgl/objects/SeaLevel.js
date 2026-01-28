import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

export class SeaLevel {
  constructor() {
    this.mesh = null;
    this.width = 4000;
    this.height = 4000;

    this.init();
  }

  init() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height);

    this.mesh = new Water(geometry, {
      textureWidth: 4400,
      textureHeight: 4400,
      waterNormals: new THREE.TextureLoader().load(
        "/textures/waternormals.png",
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        },
      ),
      sunDirection: new THREE.Vector3(1, 1, 1).normalize(),
      sunColor: 0xffffff,
      waterColor: 0x2d7290,
      distortionScale: 20,
      size: 0.3,
      fog: false,
    });

    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(-2200, 0, 1900);
  }

  update(time) {
    if (this.mesh && this.mesh.material.uniforms["time"]) {
      this.mesh.material.uniforms["time"].value = time * 1.2;
    }

    // Causticsのtime更新
    if (this.mesh.material.userData.shader) {
      this.mesh.material.userData.shader.uniforms.uTime.value = time;
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
