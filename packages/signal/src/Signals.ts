/**
 * @since 1.0.0
 */

import * as AsyncData from "@typed/async-data/AsyncData"
import { Tagged } from "@typed/context"
import type { Signal } from "./Signal.js"
import { Effect, Scope } from "effect"

/**
 * @since 1.0.0
 */
export interface Signals {
  make<A, E, R>(initial: Effect.Effect<A, E, R>): Effect.Effect<Signal<A, E>, never, R | Scope.Scope>
  getData<A, E, R>(signal: Signal<A, E, R>): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
  modifyData<A, E, R, B>(signal: Signal<A, E, R>, f: (data: AsyncData.AsyncData<E, A>) => readonly [B, AsyncData.AsyncData<E, A>]): Effect.Effect<B, never, R>
  modifyDataEffect<A, E, R, B, E2, R2>(
    signal: Signal<A, E, R>,
    f: (data: AsyncData.AsyncData<E, A>) => Effect.Effect<readonly [B, AsyncData.AsyncData<E, A>], E2, R2>
  ): Effect.Effect<B, E2, R | R2>
  
  // Success paths
  get<A, E, R>(signal: Signal<A, E, R>): Effect.Effect<A, E | AsyncData.Loading, R>
  modify<A, E, R, B>(signal: Signal<A, E, R>, f: (a: A) => readonly [B, A]): Effect.Effect<B, E | AsyncData.Loading, R>
  modifyEffect<A, E, R, B, E2, R2>(
    signal: Signal<A, E, R>,
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): Effect.Effect<B, E | E2 | AsyncData.Loading, R | R2>
}

/**
 * @since 1.0.0
 */
export const Signals: Tagged<Signals> = Tagged<Signals>("@typed/signal/Signals")
