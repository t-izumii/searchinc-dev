import * as THREE from "three";
import { getProject } from "@theatre/core";
import studio from "@theatre/studio";

export class Theatre {
  constructor() {
    this.project = null;
    this.sheet = null;
    this.isStudioInitialized = false;
    this.state = null;
  }

  // Studioを初期化（開発環境のみ）
  initStudio() {
    if (!this.isStudioInitialized) {
      studio.initialize();
      this.isStudioInitialized = true;
      console.log("Theatre.js Studio initialized");
    }
  }

  // プロジェクトを作成（state付き）
  createProject(projectName = "WebGL Project", state) {
    this.state = state; // stateを保存
    this.project = getProject(projectName, { state });
    return this.project;
  }

  // シートを作成
  createSheet(sheetName = "Main Scene") {
    if (!this.project) {
      this.createProject();
    }
    this.sheet = this.project.sheet(sheetName);
    return this.sheet;
  }

  // プロジェクトの状態をエクスポート
  exportState() {
    if (this.project) {
      return studio.createContentOfSaveFile(this.project.address.projectId);
    }
    return null;
  }

  // カメラオブジェクトを作成
  createCameraObject(camera, objectName = "Camera") {
    if (!this.sheet) {
      this.createSheet();
    }

    const cameraObject = this.sheet.object(objectName, {
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

    console.log("Camera object created:", cameraObject);

    // カメラの値を自動更新（度からラジアンに変換）
    cameraObject.onValuesChange((values) => {
      camera.position.set(values.position.x, values.position.y, values.position.z);
      camera.rotation.set(
        THREE.MathUtils.degToRad(values.rotation.x),
        THREE.MathUtils.degToRad(values.rotation.y),
        THREE.MathUtils.degToRad(values.rotation.z)
      );
    });

    // カメラオブジェクトを保存（スクロール連動で使用）
    this.cameraObject = cameraObject;
    this.camera = camera;

    return cameraObject;
  }

  // 汎用オブジェクトを作成
  createObject(objectName, props) {
    if (!this.sheet) {
      this.createSheet();
    }

    const theatreObject = this.sheet.object(objectName, props);

    return theatreObject;
  }

  // シーケンスを再生
  play(options = {}) {
    if (this.sheet && this.sheet.sequence) {
      try {
        this.sheet.sequence.play({
          iterationCount: options.iterationCount || Infinity,
          rate: options.rate || 1,
        });
      } catch (error) {
        console.error("Failed to play sequence:", error);
      }
    }
  }

  // シーケンスを一時停止
  pause() {
    if (this.sheet && this.sheet.sequence) {
      this.sheet.sequence.pause();
    }
  }

  // 特定の位置にシーク
  seekTo(position) {
    if (this.sheet && this.sheet.sequence && this.sheet.sequence.pointer) {
      this.sheet.sequence.pointer.position = position;
    }
  }

  getProject() {
    return this.project;
  }

  getSheet() {
    return this.sheet;
  }

  // スクロールに連動してアニメーション再生
  enableScrollSync(scrollTriggerConfig = {}) {
    if (!this.sheet) {
      console.warn("Cannot enable scroll sync: sheet is not initialized");
      return null;
    }

    if (!this.project) {
      console.warn("Cannot enable scroll sync: project is not initialized");
      return null;
    }

    // GSAPのScrollTriggerを動的にインポート
    return import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      return import("gsap").then(({ gsap }) => {
        gsap.registerPlugin(ScrollTrigger);

        const sequence = this.sheet.sequence;

        // project.readyを待ってからScrollTriggerを設定
        return this.project.ready.then(() => {
          // sequenceLengthをsequence.pointer.lengthから取得
          console.log("sequence.pointer:", sequence.pointer);
          console.log("sequence.pointer.length:", sequence.pointer.length);
          console.log("typeof sequence.pointer.length:", typeof sequence.pointer.length);

          const sequenceLength = sequence.pointer.length;

          console.log("Scroll sync enabled. Sequence length:", sequenceLength);
          console.log("typeof sequenceLength:", typeof sequenceLength);
          console.log("Project ready, sheet:", this.sheet);

          // デフォルトのScrollTrigger設定
          const defaultConfig = {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1, // スムーズなスクロール連動
            ...scrollTriggerConfig,
            onUpdate: (self) => {
              // スクロール進行度（0〜1）をsequence positionに変換
              const position = self.progress * sequenceLength;

              try {
                // sequence.positionに直接設定
                sequence.position = position;

                // カメラオブジェクトの値を手動で取得して適用
                if (this.cameraObject && this.camera) {
                  const values = this.cameraObject.value;
                  if (values) {
                    this.camera.position.set(values.position.x, values.position.y, values.position.z);
                    this.camera.rotation.set(
                      THREE.MathUtils.degToRad(values.rotation.x),
                      THREE.MathUtils.degToRad(values.rotation.y),
                      THREE.MathUtils.degToRad(values.rotation.z)
                    );
                  }
                }
              } catch (error) {
                console.error("Failed to set position:", error);
              }

              // カスタムonUpdateがあれば実行
              if (scrollTriggerConfig.onUpdate) {
                scrollTriggerConfig.onUpdate(self);
              }
            },
          };

          // ScrollTriggerを作成
          return ScrollTrigger.create(defaultConfig);
        });
      });
    });
  }
}
