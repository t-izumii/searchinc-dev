import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',  // 相対パスで読み込む（GitHub Pagesなどで重要）
  build: {
    outDir: 'docs',  // ビルド出力先をdocsに変更
    emptyOutDir: true,  // ビルド前にdocsフォルダを空にする
  }
})
