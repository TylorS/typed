import { Async } from '@/Async'
import { Cause } from '@/Cause'
import { None } from '@/Disposable'
import * as E from '@/Effect'
import {
  RaceErrors,
  RaceOutput,
  RaceResources,
  TupleErrors,
  TupleOutput,
  TupleResources,
} from '@/Effect'
import { Exit } from '@/Exit'
import { Fiber } from '@/Fiber/Fiber'
import { RuntimeOptions } from '@/Fiber/Runtime'
import { FiberContext } from '@/FiberContext'
import { FiberId } from '@/FiberId'
import { Either, Left } from '@/Prelude/Either'
import { IO } from '@/Prelude/IO'
import { LocalScope } from '@/Scope'
import { Trace } from '@/Trace'

import { EFx, Fx, Of, RFx } from './Fx'

export const access = <R, R2, E, A>(f: (r: R) => Fx<R2, E, A>, trace?: string): Fx<R & R2, E, A> =>
  E.access(f, trace)
export const ask = <R>(trace?: string): RFx<R, R> => E.ask<R>(trace)
export const asks = <R, A>(f: (r: R) => A, trace?: string): RFx<R, A> => E.asks(f, trace)

export const chain =
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>, trace?: string) =>
  <R, E>(fx: Fx<R, E, A>): Fx<R & R2, E | E2, B> =>
    E.chain(f, trace)(fx) as Fx<R & R2, E | E2, B>

export const disposed: <E = never, A = never>(
  id: FiberId,
  trace?: string | undefined,
) => EFx<E, A> = E.disposed

export const fail: <E, A = never>(error: E, trace?: string | undefined) => EFx<E, A> = E.fail

export const fromAsync: <A>(f: Async<A>, trace?: string | undefined) => Of<A> = E.fromAsync

export const fromEither: <E, A>(either: Either<E, A>, trace?: string | undefined) => EFx<E, A> =
  E.fromEither

export const fromExit: <E, A>(exit: Exit<E, A>, trace?: string | undefined) => EFx<E, A> =
  E.fromExit

export const fromCause = <E>(cause: Cause<E>, trace?: string | undefined): EFx<E, never> =>
  E.fromExit<E, never>(Left(cause), trace)

export const fromIO: <A, E = never>(io: IO<A>, trace?: string | undefined) => EFx<E, A> = E.fromIO

export const fromPromise: <A>(f: () => Promise<A>, trace?: string | undefined) => Of<A> =
  E.fromPromise

export const getContext: <E>(trace?: string) => EFx<E, FiberContext<E>> = E.getContext

export const getScope: <E>(trace?: string) => EFx<E, LocalScope<E, any>> = E.getScope

export const getTrace: Of<Trace> = E.getTrace

export const lazy = <R, E, A>(f: () => Fx<R, E, A>, trace?: string): Fx<R, E, A> => E.lazy(f, trace)

export const of: <A>(value: A) => Of<A> = E.of

export const provideAll: <R>(resources: R, trace?: string) => <E, A>(fx: Fx<R, E, A>) => EFx<E, A> =
  E.provide

export const race: <FX extends ReadonlyArray<Fx<any, any, any> | Fx<any, never, any>>>(
  fx: FX,
  trace?: string,
) => Fx<RaceResources<FX>, RaceErrors<FX>, RaceOutput<FX>> = E.race

export const refine = E.refine as <E2>(
  refinement: (error: unknown) => error is E2,
  trace?: string | undefined,
) => <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E2 | E, A>

export const result: <R, E, A>(
  fx: Fx<R, E, A>,
  trace?: string | undefined,
) => Fx<R, never, Exit<E, A>> = E.result

export const suspend: (trace?: string) => Of<void> = E.suspend

export const trace: Of<Trace> = E.getTrace

export const traceable: <R, E, A>(fx: Fx<R, E, A>, trace?: string | undefined) => Fx<R, E, A> =
  E.traceable

export const tuple: <FX extends ReadonlyArray<Fx<any, any, any> | Fx<any, never, any>>>(
  fx: FX,
  trace?: string,
) => Fx<TupleResources<FX>, TupleErrors<FX>, TupleOutput<FX>> = E.tuple

export const unexpected: <E = never, A = never>(
  error: unknown,
  trace?: string | undefined,
) => EFx<E, A> = E.unexpected

export const untraceable: <R, E, A>(fx: Fx<R, E, A>, trace?: string | undefined) => Fx<R, E, A> =
  E.untraceable

export const never = fromAsync<never>(Async(() => None))

export const fork: <R, E, A>(
  fx: Fx<R, E, A>,
  runtimeOptions?: RuntimeOptions<E>,
) => Fx<R, never, Fiber<E, A>> = E.fork

export const join: <E, A>(
  fx: Fiber<E, A>,
  runtimeOptions?: RuntimeOptions<E>,
) => Fx<unknown, E, A> = E.join

export const withinContext: <E>(
  context: FiberContext<E>,
  trace?: string | undefined,
) => <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = E.withinContext
