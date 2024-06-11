declare module "virtual:asset-manifest" {
  import type { ManifestChunk } from "vite"

  const assetManifest: Record<string, ManifestChunk>
  export default assetManifest
}

declare module "virtual:typed-options" {
  export const clientEntries: Record<string, string>
  export const serverEntry: string | null
  export const relativeServerToClientOutputDirectory: string
  export const assetDirectory: string
}
