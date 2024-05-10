import { makeTypedPlugin } from "@typed/vite-plugin"

import { defineConfig } from "vite"

export default defineConfig({
  envDir: import.meta.dirname,
  server: {
    host: "0.0.0.0"
  },
  plugins: [
    makeTypedPlugin({
      clientEntry: "src/client.ts",
      serverEntry: "src/server.ts",
      tsconfig: "tsconfig.build.json"
    })
  ]
})
