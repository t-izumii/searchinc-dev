// アプリケーション設定
export const config = {
  // Theatre.js設定
  theatre: {
    enableStudio: false , // true: 編集モード（UIあり、JSONなし）, false: 本番モード（UIなし、JSONあり）
    stateUrl: "/animation.json",
    projectName: "WebGL Project",
    sheetName: "Main Scene",
    sequenceLength: 6 , // シーケンスの長さ（秒）
  },

  // ScrollTrigger設定
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    markers: true, // デバッグマーカー（本番ではfalseに）
  },

  // 3Dモデル設定
  models: {
    landscape: "/landscape.glb",
  },
};
