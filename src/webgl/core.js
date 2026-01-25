import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Camera } from "./Camera.js";
import { Light } from "./Light.js";
import { Plane } from "./objects/seaLevel/Plane.js";
import { SkyObject } from "./objects/SkyObject.js";
import { GlbModel } from "./objects/GlbModel.js";
import { TheatreManager } from "./TheatreManager.js";
import { config } from "../config.js";

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
    this.models = [];
    this.theatreManager = null;

    this.sea = null;

    this.init();
    this.setupEventListeners();
    this.animate();

    // 非同期初期化を実行
    this.initAsync();
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

  async initAsync() {
    // Theatre.jsを初期化
    this.theatreManager = new TheatreManager(config.theatre);
    await this.theatreManager.init();

    this.theatreManager.register(
      this.camera.instance,
      "Camera",
      {
        position: { x: 0, y: 0, z: 5 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      (target, values) => {
        // カメラは度からラジアンへ変換
        target.position.set(
          values.position.x,
          values.position.y,
          values.position.z,
        );
        target.rotation.set(
          THREE.MathUtils.degToRad(values.rotation.x),
          THREE.MathUtils.degToRad(values.rotation.y),
          THREE.MathUtils.degToRad(values.rotation.z),
        );
      },
    );

    // ScrollTriggerを設定（開発モード時は無効化）
    if (!config.theatre.enableStudio) {
      this.theatreManager.setupScrollTrigger(config.scrollTrigger);
    }

    // 3Dモデルを読み込み
    const world = new GlbModel(config.models.landscape);
    this.models.push(world);

    world
      .load()
      .then((model) => {
        model.scene.scale.set(40, 40, 40);
        this.scene.add(model.scene);
      })
      .catch((error) => {
        console.error("Failed to load model:", error);
      });

    // 水面を作成
    this.sea = new Plane();
    this.scene.add(this.sea.getMesh());

    this.sky = new SkyObject();
    this.scene.add(this.sky.getMesh());
  }

  // sceneのgetterを追加
  getScene() {
    return this.scene;
  }

  // カメラのgetterを追加
  getCamera() {
    return this.camera;
  }

  // TheatreManagerのgetterを追加
  getTheatreManager() {
    return this.theatreManager;
  }

  // オブジェクトを追加するメソッド
  addObject(object) {
    this.scene.add(object);
  }

  // オブジェクトを削除するメソッド
  removeObject(object) {
    this.scene.remove(object);
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

    // モデルの更新
    this.models.forEach((model) => model.update());

    // カメラの更新
    this.camera.update();

    // ライトの更新
    this.light.update();

    // 水面の更新（時間を渡す）
    if (this.sea) {
      this.sea.update(performance.now() * 0.001); // 秒単位に変換
    }

    // レンダリング
    this.renderer.render(this.scene, this.camera.instance);
  };
}
