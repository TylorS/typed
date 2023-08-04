import * as Effect from '@effect/io/Effect'

import type { Fx } from './Fx.js'
import { fromEffect } from './fromEffect.js'
import { fromFxEffect } from './fromFxEffect.js'

export function promise<A>(f: (signal: AbortSignal) => Promise<A>): Fx<never, never, A> {
  return fromEffect(Effect.promise(f))
}

export function tryPromise<A>(f: (signal: AbortSignal) => Promise<A>): Fx<never, unknown, A> {
  return fromEffect(Effect.tryPromise(f))
}

export function tryCatchPromise<A, E>(
  f: (signal: AbortSignal) => Promise<A>,
  g: (error: unknown) => E,
): Fx<never, E, A> {
  return fromEffect(Effect.tryPromise({ try: f, catch: g }))
}

export function promiseFx<R, E, A>(f: (signal: AbortSignal) => Promise<Fx<R, E, A>>): Fx<R, E, A> {
  return fromFxEffect(Effect.promise(f))
}

export function tryPromiseFx<R, E, A>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
): Fx<R, unknown, A> {
  return fromFxEffect(Effect.tryPromise(f))
}

export function tryCatchPromiseFx<R, E, A, E2>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
  g: (error: unknown) => E2,
): Fx<R, E | E2, A> {
  return fromFxEffect(Effect.tryPromise({ try: f, catch: g }))
}
