/**
 * @since 1.0.0
 */

import type * as AsyncData from "@typed/async-data/AsyncData"
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

  getComputed<A, E, R>(computed: Computed<A, E, R>): Effect.Effect<A, E | AsyncData.Loading, R>
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
