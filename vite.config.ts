import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  return {
    plugins: [vue()],
    build: {
      emptyOutDir: false,
      outDir: 'dist/renderer',
      sourcemap: !isProd,
      minify: false,
      lib: {
        entry: resolve(__dirname, 'src/renderer/main.ts'),
        fileName: () => 'index.mjs',
        formats: ['es']
      }
    }
  }
})
