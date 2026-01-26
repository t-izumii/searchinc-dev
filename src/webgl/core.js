import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Camera } from "./Camera.js";
import { Light } from "./Light.js";

export class WebGLApp {
  constructor(selector) {
    // コンテナを取得
    const container = document.querySelector(selector);
    if (!container) {
      throw new Error(`Container not found: ${selector}`);
    }

    // canvasを生成してコンテナに追加
    this.canvas = document.createElement("canvas");
    container.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.camera = new Camera();
    this.light = new Light(this.scene);
    this.controls = null;
    this.updateCallbacks = [];

    this.init();
    this.setupEventListeners();
    this.animate();
  }

  init() {
    // シーンの背景色
    this.scene.background = new THREE.Color(0x1a3a4a);

    // レンダラーの設定
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  // sceneのgetterを追加
  getScene() {
    return this.scene;
  }

  // カメラのgetterを追加
  getCamera() {
    return this.camera;
  }

  // rendererのgetterを追加
  getRenderer() {
    return this.renderer;
  }

  // オブジェクトを追加するメソッド
  addObject(object) {
    this.scene.add(object);
  }

  // オブジェクトを削除するメソッド
  removeObject(object) {
    this.scene.remove(object);
  }

  // アニメーションループに更新処理を追加するメソッド
  addUpdateCallback(callback) {
    this.updateCallbacks.push(callback);
  }

  // OrbitControlsを有効化するメソッド
  enableOrbitControls(options = {}) {
    if (!this.controls) {
      this.controls = new OrbitControls(this.camera.instance, this.canvas);
      this.controls.enableDamping = options.enableDamping ?? true;
      this.controls.dampingFactor = options.dampingFactor ?? 0.05;
      this.controls.enableZoom = options.enableZoom ?? true;
      this.controls.enablePan = options.enablePan ?? true;
    }
    return this.controls;
  }

  // OrbitControlsを取得するメソッド
  getControls() {
    return this.controls;
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.onResize());
  }

  onResize() {
    // カメラのアスペクト比を更新
    this.camera.resize();

    // レンダラーのサイズを更新
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    // カメラの更新
    this.camera.update();

    // ライトの更新
    this.light.update();

    // 登録された更新処理を実行
    this.updateCallbacks.forEach((callback) => callback());

    // レンダリング
    this.renderer.render(this.scene, this.camera.instance);
  };
}
