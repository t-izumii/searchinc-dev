import * as THREE from "three";

export class Light {
  constructor(scene) {
    this.scene = scene;
    this.ambientLight = null;
    this.directionalLight = null;
    this.underwaterLight = null;
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

    // 水中用のディレクショナルライト（水面から真下向き、初期状態では非表示）
    this.underwaterLight = new THREE.DirectionalLight(0xffffff, 100.0);
    this.underwaterLight.position.set(0, 0, 0); // 水面より上に配置
    this.underwaterLight.target.position.set(0, -100, 0); // 真下を向くようにターゲットを設定
    this.underwaterLight.visible = false;
    this.scene.add(this.underwaterLight);
    this.scene.add(this.underwaterLight.target);
  }

  // 水中状態に応じてライトを切り替え
  setUnderwater(isUnderwater) {
    if (this.underwaterLight) {
      this.underwaterLight.visible = isUnderwater;
    }
  }

  update() {}
}
