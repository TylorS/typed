/* eslint-disable @typescript-eslint/consistent-type-imports */

declare module "virtual:asset-manifest" {
  const assetManifest: Record<string, import("vite").ManifestChunk>
  export default assetManifest
}

declare module "virtual:typed-options" {
  import type { TypedOptions } from "@typed/vite-plugin"

  const options: TypedOptions
  export default options
}
