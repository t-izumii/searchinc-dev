import * as THREE from "three";
import { GlbModel } from "../objects/GlbModel.js";
import { SeaLevel } from "../objects/SeaLevel.js";
import { Caustic } from "../objects/Caustics.js";
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
    this.sea1 = null;
    this.sea2 = null;
    this.caustic = null;
    this.sky = null;
    this.title = null;
    this.text = null;
    this.heading = new THREE.Group();
    this.mountain = null;
    this.underwater = null;

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
        position: { x: 0, y: 0, z: 0 },
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

      console.log(model.scene.children);

      // オブジェクトを取得
      this.title = model.scene.getObjectByName("intro_title");
      this.text = model.scene.getObjectByName("intro_sub");
      this.underwater = model.scene.getObjectByName("underwater");
      this.mountain = model.scene.getObjectByName("mountain");

      // mountainに岩のテクスチャを適用
      if (this.underwater) {
        const textureLoader = new THREE.TextureLoader();
        const rockTexture = textureLoader.load("/textures/image.png");

        // テクスチャの設定
        rockTexture.wrapS = THREE.RepeatWrapping;
        rockTexture.wrapT = THREE.RepeatWrapping;
        rockTexture.repeat.set(6, 6); // テクスチャの繰り返し回数

        // mountainの全てのメッシュにテクスチャを適用
        this.underwater.traverse((child) => {
          if (child.isMesh) {
            child.material = child.material.clone();
            child.material.map = rockTexture;
            child.material.needsUpdate = true;
          }
        });
      }

      // mountainに岩のテクスチャを適用
      if (this.mountain) {
        const textureLoader = new THREE.TextureLoader();
        const rockTexture = textureLoader.load("/textures/mountain.png");

        // テクスチャの設定
        rockTexture.wrapS = THREE.RepeatWrapping;
        rockTexture.wrapT = THREE.RepeatWrapping;
        rockTexture.repeat.set(6, 6); // テクスチャの繰り返し回数

        // mountainの全てのメッシュにテクスチャを適用
        this.mountain.traverse((child) => {
          if (child.isMesh) {
            child.material = child.material.clone();
            child.material.map = rockTexture;
            child.material.needsUpdate = true;
          }
        });
      }

      // attach()を使うとワールド座標を保持したまま親を変更できる
      this.heading.attach(this.title);
      this.heading.attach(this.text);

      this.scene.add(this.heading);

      // スタイル調整（マテリアルをクローンして独立させる）
      if (this.title) {
        this.title.material = this.title.material.clone();
        this.title.material.color.setHex(0xffffff);
        this.title.material.emissive.setHex(0xffffff);
        this.title.material.emissiveIntensity = 0.5;
        this.title.material.toneMapped = false;
      }

      if (this.text) {
        this.text.material = this.title.material.clone();
        this.text.material.color.setHex(0xffffff);
        this.text.material.emissive.setHex(0xffffff);
        this.text.material.emissiveIntensity = 0.5;
        this.text.material.toneMapped = false;
      }
    } catch (error) {
      console.error("Failed to load model:", error);
    }

    this.heading.position.y -= 20;

    // 水面を作成
    this.sea1 = new SeaLevel();
    this.scene.add(this.sea1.getMesh());

    this.sea2 = new SeaLevel();
    this.sea2.getMesh().rotation.x += Math.PI;
    this.scene.add(this.sea2.getMesh());

    // RenderTargetのサイズを大きくして解像度を上げる（512 → 2048）
    this.caustic = new Caustic(2048);

    // @@@ コースティクスのメッシュを可視化（一時的）
    // const causticMesh = this.caustic.getMesh();
    // causticMesh.position.set(-2000, 1, 2000);
    // this.scene.add(causticMesh);

    // コースティクステクスチャをmountainに適用
    if (this.underwater) {
      const causticTexture = this.caustic.getTexture();
      // テクスチャを繰り返すように設定
      causticTexture.wrapS = THREE.RepeatWrapping;
      causticTexture.wrapT = THREE.RepeatWrapping;
      this.applyCausticsToMountain(this.underwater, causticTexture);
    }

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
    if (this.sea1) {
      this.app.addUpdateCallback(() => {
        this.sea1.update(performance.now() * 0.001); // 秒単位に変換
      });
    }

    if (this.sea2) {
      this.app.addUpdateCallback(() => {
        this.sea2.update(performance.now() * 0.001); // 秒単位に変換
      });
    }

    // 更新処理の修正
    if (this.caustic) {
      this.app.addUpdateCallback(() => {
        this.caustic.update(this.app.renderer, performance.now() * 0.001);
      });
    }

    // mountainのシェーダーのuTimeを更新
    if (this.underwater) {
      this.app.addUpdateCallback(() => {
        const time = performance.now() * 0.001;
        this.underwater.traverse((child) => {
          if (
            child.isMesh &&
            child.material &&
            child.material.userData.shader
          ) {
            child.material.userData.shader.uniforms.uTime.value = time;
          }
        });
      });
    }

    // 水中エフェクトの更新
    this.app.addUpdateCallback(() => {
      this.updateUnderwaterEffect();
    });
  }

  // 水中エフェクトの更新
  updateUnderwaterEffect() {
    const waterLevel = 0; // SeaLevelと同じY座標
    const cameraY = this.camera.instance.position.y;

    // カメラが水面より下にいるかチェック
    const isUnderwater = cameraY < waterLevel;

    // 水中用ライトの切り替え
    const light = this.app.getLight();
    if (light) {
      light.setUnderwater(isUnderwater);
    }

    if (isUnderwater) {
      // 水中：明るく透明感のある青色のフォグを有効化
      if (!this.scene.fog) {
        this.scene.fog = new THREE.FogExp2(0xc0e8ff, 0.0004);
      }
      // 水深に応じてフォグの濃度を調整（濃度も薄くする）
      const depth = waterLevel - cameraY;
      this.scene.fog.density = 0.0004;
      this.scene.fog.color.setHex(0xc0e8ff);

      // 海面の表示切り替え：水中ではsea1を非表示、sea2を表示
      if (this.sea1) {
        this.sea1.getMesh().visible = false;
      }
      if (this.sea2) {
        this.sea2.getMesh().visible = true;
      }
    } else {
      // 水上：フォグを無効化
      if (this.scene.fog) {
        this.scene.fog = null;
      }

      // 海面の表示切り替え：水上ではsea1を表示、sea2を非表示
      if (this.sea1) {
        this.sea1.getMesh().visible = true;
      }
      if (this.sea2) {
        this.sea2.getMesh().visible = false;
      }
    }
  }

  // mountainにコースティクスを適用
  applyCausticsToMountain(mountain, causticTexture) {
    mountain.traverse((child) => {
      if (child.isMesh && child.material) {
        const material = child.material;

        // マテリアルのシェーダーをカスタマイズ
        material.onBeforeCompile = (shader) => {
          // ユニフォームを追加
          shader.uniforms.tCaustics = { value: causticTexture };
          shader.uniforms.uWaterLevel = { value: 0 }; // 水面のY座標
          shader.uniforms.uWaterSize = { value: 4000 }; // 水面のサイズ
          shader.uniforms.uCausticsIntensity = { value: 2.0 }; // コースティクスの強度を上げる
          shader.uniforms.uTime = { value: 0 }; // 時間のuniform

          // 頂点シェーダーにvarying変数を追加
          shader.vertexShader = shader.vertexShader.replace(
            "#include <common>",
            `
            #include <common>
            varying vec3 vWorldPosition;
            `,
          );

          shader.vertexShader = shader.vertexShader.replace(
            "#include <worldpos_vertex>",
            `
            #include <worldpos_vertex>
            vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
            `,
          );

          // フラグメントシェーダーにuniform宣言を追加
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            `
            #include <common>
            uniform sampler2D tCaustics;
            uniform float uWaterLevel;
            uniform float uWaterSize;
            uniform float uCausticsIntensity;
            uniform float uTime;
            varying vec3 vWorldPosition;
            `,
          );

          // フラグメントシェーダーでコースティクスを適用
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <dithering_fragment>",
            `
            #include <dithering_fragment>

            // ワールド座標からUV座標を計算（タイリングで無限に繰り返す）
            // スケールファクター：値を大きくすると模様が小さくなる
            float scale = 0.0002; // 1 / 2000
            vec2 causticsUV = vWorldPosition.xz * scale;

            // コースティクステクスチャをサンプリング
            vec4 causticsColor = texture2D(tCaustics, causticsUV);

            // コースティクスの効果を強調
            float caustics = causticsColor.r * uCausticsIntensity;

            // 青緑色でコースティクスを加算
            gl_FragColor.rgb += caustics * abs(vWorldPosition.y) * 0.00005 * vec3(0.4, 0.6, 0.8);
            `,
          );

          // シェーダーを保存（後でuniformを更新するため）
          material.userData.shader = shader;
        };

        material.needsUpdate = true;
      }
    });
  }

  // TheatreManagerを取得
  getTheatreManager() {
    return this.theatreManager;
  }
}
