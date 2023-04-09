import type { Fx } from '@typed/fx/Fx'
import { Effect } from '@typed/fx/externals'
import { fromEffect } from '@typed/fx/fromEffect'
import { fromFxEffect } from '@typed/fx/fromFxEffect'

export function promise<A>(f: () => Promise<A>): Fx<never, never, A> {
  return fromEffect(Effect.promise(f))
}

export function promiseInterrupt<A>(f: (signal: AbortSignal) => Promise<A>): Fx<never, never, A> {
  return fromEffect(Effect.promiseInterrupt(f))
}

export function tryPromise<A>(f: () => Promise<A>): Fx<never, unknown, A> {
  return fromEffect(Effect.tryPromise(f))
}

export function tryPromiseInterrupt<A>(
  f: (signal: AbortSignal) => Promise<A>,
): Fx<never, unknown, A> {
  return fromEffect(Effect.tryPromiseInterrupt(f))
}

export function tryCatchPromise<A, E>(
  f: () => Promise<A>,
  g: (error: unknown) => E,
): Fx<never, E, A> {
  return fromEffect(Effect.tryCatchPromise(f, g))
}

export function tryCatchPromiseInterrupt<A, E>(
  f: (signal: AbortSignal) => Promise<A>,
  g: (error: unknown) => E,
): Fx<never, E, A> {
  return fromEffect(Effect.tryCatchPromiseInterrupt(f, g))
}

export function promiseFx<R, E, A>(f: () => Promise<Fx<R, E, A>>): Fx<R, E, A> {
  return fromFxEffect(Effect.promise(f))
}

export function promiseInterruptFx<R, E, A>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
): Fx<R, E, A> {
  return fromFxEffect(Effect.promiseInterrupt(f))
}

export function tryPromiseFx<R, E, A>(f: () => Promise<Fx<R, E, A>>): Fx<R, unknown, A> {
  return fromFxEffect(Effect.tryPromise(f))
}

export function tryPromiseInterruptFx<R, E, A>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
): Fx<R, unknown, A> {
  return fromFxEffect(Effect.tryPromiseInterrupt(f))
}

export function tryCatchPromiseFx<R, E, A, E2>(
  f: () => Promise<Fx<R, E, A>>,
  g: (error: unknown) => E2,
): Fx<R, E | E2, A> {
  return fromFxEffect(Effect.tryCatchPromise(f, g))
}

export function tryCatchPromiseInterruptFx<R, E, A, E2>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
  g: (error: unknown) => E2,
): Fx<R, E | E2, A> {
  return fromFxEffect(Effect.tryCatchPromiseInterrupt(f, g))
}
