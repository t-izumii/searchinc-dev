import { WebGLApp, MainScene } from "./webgl/index.js";

// Three.jsの基本初期化
const app = new WebGLApp(".webgl");

// メインシーンを作成してオブジェクトを追加
const mainScene = new MainScene(app);
