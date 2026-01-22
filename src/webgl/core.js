import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getProject } from "@theatre/core";
import studio from "@theatre/studio";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Camera } from "./Camera.js";
import { Light } from "./Light.js";
import { GlbModel } from "./objects/GlbModel.js";

gsap.registerPlugin(ScrollTrigger);

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

    this.init();
    this.setupEventListeners();
    this.animate();

    // 非同期初期化を実行
    this.initAsync();
  }

  init() {
    // シーンの背景色
    this.scene.background = new THREE.Color(0x1a1a1a);

    // レンダラーの設定
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  async initAsync() {
    // Theatre.js stateを読み込み
    let theatreState = null;
    // try {
    //   const response = await fetch("/animation.json");
    //   if (response.ok) {
    //     theatreState = await response.json();
    //   }
    // } catch (error) {
    //   console.warn("Failed to load Theatre state:", error);
    // }

    // Theatre.jsを初期化
    studio.initialize();
    const project = getProject("WebGL Project", { state: theatreState });
    const sheet = project.sheet("Main Scene");

    // カメラオブジェクトを作成
    const camera = this.camera.instance;
    const cameraObj = sheet.object("Camera", {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
      rotation: {
        x: THREE.MathUtils.radToDeg(camera.rotation.x),
        y: THREE.MathUtils.radToDeg(camera.rotation.y),
        z: THREE.MathUtils.radToDeg(camera.rotation.z),
      },
    });

    // project.ready後にScrollTrigger設定
    project.ready.then(() => {
      // sequenceLengthをstateから取得
      let sequenceLength = 10; // デフォルト値
      if (theatreState && theatreState.sheetsById) {
        const sheetData = Object.values(theatreState.sheetsById)[0];
        if (sheetData && sheetData.sequence && sheetData.sequence.length) {
          sequenceLength = sheetData.sequence.length;
        }
      }

      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        markers: true,
        onUpdate: (self) => {
          // シーケンス位置を設定
          const position = self.progress * sequenceLength;
          sheet.sequence.position = position;

          // カメラの値を取得して適用
          const values = cameraObj.value;
          if (values) {
            camera.position.set(
              values.position.x,
              values.position.y,
              values.position.z
            );
            camera.rotation.set(
              THREE.MathUtils.degToRad(values.rotation.x),
              THREE.MathUtils.degToRad(values.rotation.y),
              THREE.MathUtils.degToRad(values.rotation.z)
            );
          }
        },
      });
    });

    // 3Dモデルを読み込み
    const world = new GlbModel("/landscape.glb");
    this.models.push(world);

    world
      .load()
      .then((model) => {
        this.scene.add(model.scene);
      })
      .catch((error) => {
        console.error("Failed to load model:", error);
      });
  }

  // sceneのgetterを追加
  getScene() {
    return this.scene;
  }

  // カメラのgetterを追加
  getCamera() {
    return this.camera;
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

    // レンダリング
    this.renderer.render(this.scene, this.camera.instance);
  };
}
