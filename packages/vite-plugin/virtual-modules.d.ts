declare module "virtual:asset-manifest" {
  import type { AssetManifest } from "@typed/vite-plugin"

  const assetManifest: AssetManifest
  export default assetManifest
}

declare module "virtual:typed-options" {
  import type { TypedOptions } from "@typed/vite-plugin"

  const options: TypedOptions
  export default options
}
