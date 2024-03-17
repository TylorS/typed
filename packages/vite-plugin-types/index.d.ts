declare module "virtual:asset-manifest" {
  import type { ManifestChunk } from "vite"

  const assetManifest: Record<string, ManifestChunk>
  export default assetManifest
}

declare module "virtual:typed-options" {
  export const clientEntry: string
  export const serverEntry: string
  export const relativeServerToClientOutputDirectory: string
  export const assetDirectory: string
}
