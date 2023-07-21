import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// plugin to inject css in js for export
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import NestedAppConfig from './NestedApp.config.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), cssInjectedByJsPlugin()],

  // modify naming of output to remove hashes
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `${NestedAppConfig.nestedAppName}_assets/[name].[ext]`
      }
    }
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // load global package for scss
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/global";
          @import "@/styles/theme";
        `
      }
    }
  }
})
