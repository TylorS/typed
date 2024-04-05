/**
 * @since 1.0.0
 */

import type { Tagged } from "@typed/context"
import type { Effect, Layer, Scope } from "effect"
import * as internal from "./internal/signals.js"
import type { Computed, Signal } from "./Signal.js"
import type { SignalQueue } from "./SignalQueue.js"

/**
 * @since 1.0.0
 */
export interface Signals {
  make<A, E, R>(initial: Effect.Effect<A, E, R>): Effect.Effect<Signal<A, E>, never, R | Scope.Scope>

  compute<A, E, R>(
    effect: Effect.Effect<A, E, R>,
    options?: { priority?: number }
  ): Effect.Effect<Computed<A, E>, never, R | Scope.Scope>
}

/**
 * @since 1.0.0
 */
export const Signals: Tagged<Signals> = internal.tag

/**
 * @since 1.0.0
 */
export type SignalsOptions = {
  readonly waitForExit: boolean
}

/**
 * @since 1.0.0
 */
export const layer: (options?: Partial<SignalsOptions>) => Layer.Layer<Signals, never, SignalQueue> = internal.layer
