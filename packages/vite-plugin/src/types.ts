/**
 * @since 1.0.0
 */

/// <reference types="@typed/vite-plugin-types" />

/**
 * @since 1.0.0
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type AssetManifest = Compact<typeof import("virtual:asset-manifest").default>

/**
 * @since 1.0.0
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type TypedOptions = Compact<typeof import("virtual:typed-options")>

type Compact<T> = { [K in keyof T]: T[K] }
