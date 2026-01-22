import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export class GlbModel {
  constructor(modelPath) {
    this.modelPath = modelPath;
    this.model = null;
    this.loader = new GLTFLoader();
    this.isLoaded = false;

    // DRACOLoaderの設定
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    this.loader.setDRACOLoader(dracoLoader);
  }

  async load() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        this.modelPath,
        (gltf) => {
          this.model = gltf; // gltf全体を保持
          this.isLoaded = true;
          resolve(gltf); // gltf全体を返却
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
          reject(error);
        }
      );
    });
  }

  update() {
    if (this.model) {
      // アニメーションが必要な場合はここに記述
    }
  }

  getModel() {
    return this.model;
  }
}
