import { getProject } from "@theatre/core";
import studio from "@theatre/studio";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export class TheatreManager {
  constructor(options = {}) {
    this.enableStudio = options.enableStudio ?? true;
    // enableStudioがfalseの場合のみJSONから読み込む
    this.useState = !this.enableStudio;
    this.stateUrl = options.stateUrl ?? "/animation.json";
    this.projectName = options.projectName ?? "WebGL Project";
    this.sheetName = options.sheetName ?? "Main Scene";
    this.sequenceLength = options.sequenceLength ?? 10;

    this.project = null;
    this.sheet = null;
    this.state = null;

    // 登録されたオブジェクトを管理
    this.objects = [];
  }

  async init() {
    // Theatre.js stateを読み込み（useStateがtrueの場合のみ）
    if (this.useState) {
      try {
        const response = await fetch(this.stateUrl);
        if (response.ok) {
          this.state = await response.json();
        }
      } catch (error) {
        console.warn("Failed to load Theatre state:", error);
      }
    }

    // Theatre.jsを初期化
    studio.initialize();

    if (this.enableStudio) {
      // 開発モード: UIを表示
      studio.ui.restore();
    } else {
      // 本番モード: UIを非表示
      studio.ui.hide();
    }

    this.project = getProject(this.projectName, { state: this.state });
    this.sheet = this.project.sheet(this.sheetName);

    // project.readyを待つ
    await this.project.ready;

    // シーケンスの長さを設定
    this.sheet.sequence.length = this.sequenceLength;

    return this;
  }

  // オブジェクトを登録（gsap.toのような使い方）
  register(target, name, props, updateCallback) {
    if (!this.sheet) {
      console.warn("Theatre.js is not initialized. Call init() first.");
      return null;
    }

    const theatreObj = this.sheet.object(name, props);

    this.objects.push({
      name,
      target,
      theatreObj,
      update: updateCallback,
    });

    // Theatre.jsのシーケンス操作時にも値を適用
    theatreObj.onValuesChange((values) => {
      if (updateCallback) {
        updateCallback(target, values);
      }
    });

    return theatreObj;
  }

  setupScrollTrigger(options = {}) {
    if (!this.sheet) {
      console.warn("Theatre.js is not initialized. Call init() first.");
      return null;
    }

    const defaultOptions = {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      markers: false,
      ...options,
    };

    const scrollTrigger = ScrollTrigger.create({
      ...defaultOptions,
      onUpdate: (self) => {
        // シーケンス位置を設定
        const position = self.progress * this.sequenceLength;
        this.sheet.sequence.position = position;

        // 登録された全オブジェクトの値を更新
        this.objects.forEach((obj) => {
          const values = obj.theatreObj.value;
          if (values && obj.update) {
            obj.update(obj.target, values);
          }
        });

        // カスタムonUpdateコールバック
        if (options.onUpdate) {
          options.onUpdate(self);
        }
      },
    });

    return scrollTrigger;
  }

  // オブジェクトを名前で取得
  getObject(name) {
    const obj = this.objects.find((o) => o.name === name);
    return obj ? obj.theatreObj : null;
  }

  // 全オブジェクトを取得
  getAllObjects() {
    return this.objects;
  }

  getProject() {
    return this.project;
  }

  getSheet() {
    return this.sheet;
  }
}
