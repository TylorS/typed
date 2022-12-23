import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'

import { Fx } from '../Fx.js'

import { drain } from './drain.js'

export const unsafeRunAsync = <E, A>(fx: Fx<never, E, A>): void => Effect.unsafeRunAsync(drain(fx))

export const unsafeRunAsyncWith =
  <E>(f: (exit: Exit.Exit<E, void>) => void) =>
  <A>(fx: Fx<never, E, A>): void =>
    Effect.unsafeRunAsyncWith(drain(fx), f)

export const unsafeFork = <E, A>(fx: Fx<never, E, A>): Fiber.RuntimeFiber<E, void> =>
  Effect.unsafeFork(drain(fx))

export const unsafeRunPromise = <E, A>(fx: Fx<never, E, A>): Promise<void> =>
  Effect.unsafeRunPromise(drain(fx))

export const unsafeRunPromiseExit = <E, A>(fx: Fx<never, E, A>): Promise<Exit.Exit<E, void>> =>
  Effect.unsafeRunPromiseExit(drain(fx))

export const fork = <R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>> => Effect.fork(drain(fx))

export const forkDaemon = <R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>> => Effect.forkDaemon(drain(fx))

export const forkScoped = <R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R | Scope.Scope, never, Fiber.RuntimeFiber<E, void>> =>
  Effect.forkScoped(drain(fx))
