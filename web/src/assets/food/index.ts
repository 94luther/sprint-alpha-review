// Client-bundled copies of the demo food photos (mirrors web/public/food,
// which stays in place untouched for the normal dev-server / API-backed
// build). Vite's import.meta.glob pulls every jpg in this folder in as a
// real module import, so with build.assetsInlineLimit set high (see
// vite.config.ts) each one lands in the JS bundle as a data: URI instead of
// a separate file on disk. That is what lets the standalone build become a
// single index.html with no network fetches for images.
//
// Keyed by bare filename ("stew.jpg") so demoApi.ts can translate a seed
// record's "/food/stew.jpg" reference into the bundled URL with one lookup.
const modules = import.meta.glob('./*.jpg', { eager: true, import: 'default' }) as Record<string, string>

const foodImages: Record<string, string> = {}
for (const path in modules) {
  const filename = path.split('/').pop()
  if (filename) foodImages[filename] = modules[path]
}

export default foodImages
