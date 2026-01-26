import * as THREE from "three";
import { GlbModel } from "../objects/GlbModel.js";
import { Plane } from "../objects/seaLevel/Plane.js";
import { SkyObject } from "../objects/SkyObject.js";
import { TheatreManager } from "../TheatreManager.js";
import { config } from "../../config.js";

export class MainScene {
  constructor(webglApp) {
    this.app = webglApp;
    this.scene = webglApp.getScene();
    this.camera = webglApp.getCamera();
    this.theatreManager = null;
    this.models = [];
    this.sea = null;
    this.sky = null;
    this.title = null;
    this.text = null;
    this.heading = new THREE.Group();

    // 非同期初期化を実行
    this.init();
  }

  async init() {
    // Theatre.jsを初期化
    await this.setupTheatre();

    // 3Dオブジェクトを読み込み
    await this.loadObjects();
  }

  async setupTheatre() {
    this.theatreManager = new TheatreManager(config.theatre);
    await this.theatreManager.init();

    // カメラをTheatre.jsに登録
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
  }

  async loadObjects() {
    // 3Dモデルを読み込み
    const world = new GlbModel(config.models.landscape);
    this.models.push(world);

    try {
      const model = await world.load();
      model.scene.scale.set(40, 40, 40);
      this.scene.add(model.scene);

      // オブジェクトを取得
      this.title = model.scene.getObjectByName("intro_title");
      this.text = model.scene.getObjectByName("intro_sub");

      // attach()を使うとワールド座標を保持したまま親を変更できる
      this.heading.attach(this.title);
      this.heading.attach(this.text);

      this.scene.add(this.heading);

      // スタイル調整
      this.title.material.color.setHex(0xffffff);
    } catch (error) {
      console.error("Failed to load model:", error);
    }

    this.heading.position.y -= 20;

    // 水面を作成
    this.sea = new Plane();
    this.scene.add(this.sea.getMesh());

    // 空を作成
    this.sky = new SkyObject();
    this.scene.add(this.sky.getMesh());

    // 更新処理を登録
    this.registerUpdateCallbacks();
  }

  registerUpdateCallbacks() {
    // モデルの更新
    this.app.addUpdateCallback(() => {
      this.models.forEach((model) => model.update());
    });

    // 水面の更新
    if (this.sea) {
      this.app.addUpdateCallback(() => {
        this.sea.update(performance.now() * 0.001); // 秒単位に変換
      });
    }
  }

  // TheatreManagerを取得
  getTheatreManager() {
    return this.theatreManager;
  }
}
