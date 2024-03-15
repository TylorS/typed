import type { ManifestChunk } from "vite"

export interface TypedOptions {
  readonly clientEntry: string
  readonly serverEntry: string
  readonly relativeServerToClientOutputDirectory: string
  readonly assetDirectory: string
}

export type AssetManifest = Record<string, ManifestChunk>
