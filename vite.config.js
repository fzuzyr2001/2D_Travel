import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/2D_Travel/',   // 👈 仓库名，前后都要 /
})
