import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  worker: {
    format: 'iife',
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'preact',
              test: /node_modules[\\/]preact/,
              priority: 20,
            }
          ]
        }
      }
    }
  },
})
