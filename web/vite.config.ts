import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npx vite build --mode standalone` (or VITE_DEMO_STANDALONE=1) produces a
// single self-contained dist/index.html: every image already lands as a
// data: URI thanks to assetsInlineLimit below, and vite-plugin-singlefile
// inlines the remaining JS/CSS chunks straight into that one file too, so
// the whole app can be published as a Claude artifact or opened on a phone
// with zero network requests and no localhost:4000 API behind it. The
// normal `npm run build` (no mode flag) is untouched: it still emits the
// regular multi-file, API-backed build.
export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone'
  return {
    plugins: [react(), ...(standalone ? [viteSingleFile()] : [])],
    server: {
      port: 5173,
      strictPort: true
    },
    preview: {
      port: 5173,
      strictPort: true
    },
    build: {
      // 10MB: comfortably above every demo photo (the biggest is under
      // 200KB), so every asset the standalone bundle touches gets inlined
      // as base64 instead of written out as a separate dist file.
      assetsInlineLimit: standalone ? 10485760 : undefined
    }
  }
})
