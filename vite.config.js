import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'
import topLevelAwait from "vite-plugin-top-level-await";

export default {
  plugins: [react(), vike(),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: "__tla",
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: i => `__tla_${i}`
    })
  ],

}
