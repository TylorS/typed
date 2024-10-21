import { makeTypedPlugin } from "@typed/vite-plugin"
import { join } from "path"
import { defineConfig } from "vite"

const foldersToExclude = ["tempo-data", "data", "dist", "node_modules"].map((folder) =>
  join(import.meta.dirname, `${folder}/**`)
)

export default defineConfig({
  envDir: import.meta.dirname,
  server: {
    host: "0.0.0.0",
    watch: {
      ignored: foldersToExclude
    }
  },
  plugins: [
    makeTypedPlugin({
      clientEntries: {
        browser: "./src/browser.ts"
      },
      serverEntry: "./src/server.ts",
      tsconfig: "tsconfig.build.json"
    })
  ]
})
