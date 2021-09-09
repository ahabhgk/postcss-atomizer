import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import atomizer from '../dist'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  css: {
    postcss: {
      plugins: [atomizer({ atomicCssFile: path.resolve(__dirname, 'atom.css') })],
    },
  },
})
