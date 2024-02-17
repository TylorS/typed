/**
 * @since 1.0.0
 */

import type { Effect, Layer } from "effect"
import * as internalFromWindow from "./internal/fromWindow.js"
import * as internalMemory from "./internal/memory.js"
import type { BeforeNavigationEvent, Destination, Navigation, NavigationError } from "./Navigation.js"

/**
 * @since 1.0.0
 */
export const fromWindow: Layer.Layer<Navigation, never, Window> = internalFromWindow.fromWindow

/**
 * @since 1.0.0
 */
export interface MemoryOptions {
  readonly entries: ReadonlyArray<Destination>
  readonly origin?: string | undefined
  readonly base?: string | undefined
  readonly currentIndex?: number | undefined
  readonly maxEntries?: number | undefined
  readonly commit?: Commit
}

/**
 * @since 1.0.0
 */
export const memory: (options: MemoryOptions) => Layer.Layer<Navigation> = internalMemory.memory

/**
 * @since 1.0.0
 */
export interface InitialMemoryOptions {
  readonly url: string | URL
  readonly origin?: string | undefined
  readonly base?: string | undefined
  readonly maxEntries?: number | undefined
  readonly state?: unknown
  readonly commit?: Commit
}

/**
 * @since 1.0.0
 */
export const initialMemory: (options: InitialMemoryOptions) => Layer.Layer<Navigation> = internalMemory.initialMemory

/**
 * @since 1.0.0
 */
export type Commit = (to: Destination, event: BeforeNavigationEvent) => Effect.Effect<void, NavigationError>
