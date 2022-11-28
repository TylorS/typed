import * as Context from '@fp-ts/data/Context'
import { flow, identity } from '@fp-ts/data/Function'
import { Cause, CauseError } from '@typed/cause'
import { Exit } from '@typed/exit'
import { SingleShotGen } from '@typed/internal'

import { Fiber, isFiber } from '../fiber/Fiber.js'
import { FiberRef, isFiberRef } from '../fiberRef/fiberRef.js'
import { Future, isFuture } from '../future/future.js'
import { Platform } from '../platform/index.js'

export interface Effect<R, E, A> extends Effect.Variance<R, E, A> {
  readonly [Symbol.iterator]: () => Generator<Effect<R, E, any>, A, any>
  readonly traced: (trace?: string) => Effect<R, E, A>
}

export function Effect<Y extends Effect<any, any, any>, R>(
  f: (adapter: Effect.Adapter) => Generator<Y, R>,
  __trace?: string,
): Effect<Effect.ResourcesOf<Y>, Effect.ErrorsOf<Y>, R> {
  return new Lazy(() => {
    const gen = f(Effect.Adapter)

    return new OrElseCause([
      runGen(gen, gen.next()),
      // TODO: Get the error to throw
      (cause) => runGen(gen, gen.throw(new CauseError(cause))),
    ])
  }).traced(__trace)
}

function runGen(
  gen: Generator<Effect<any, any, any>, any>,
  result: IteratorResult<Effect<any, any, any>, any>,
): Effect<any, any, any> {
  return result.done
    ? new Now(result.value)
    : new FlatMap([result.value, (a) => runGen(gen, gen.next(a))])
}

export namespace Effect {
  export const TypeId = Symbol('@typed/io/Effect')
  export type TypeId = typeof TypeId

  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    }
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  export type ResourcesOf<T> = [T] extends [never]
    ? never
    : [T] extends [Effect.Variance<infer R, infer _E, infer _A>]
    ? R
    : never

  export type ErrorsOf<T> = [T] extends [never]
    ? never
    : [T] extends [Effect.Variance<infer _R, infer E, infer _A>]
    ? E
    : never

  export type ValuesOf<T> = [T] extends [never]
    ? never
    : [T] extends [Effect.Variance<infer _R, infer _E, infer A>]
    ? A
    : never
  /* eslint-enable @typescript-eslint/no-unused-vars */

  export const Variance: Variance<any, any, any>[TypeId] = {
    _R: identity,
    _E: identity,
    _A: identity,
  }

  export interface Adapter {
    <R>(effect: Context.Tag<R>, __trace?: string): Effect<R, never, R>
    <R, E, A>(effect: Future<R, E, A>, __trace?: string): Effect<R, E, A>
    <R, E, A>(effect: FiberRef<R, E, A>, __trace?: string): Effect<R, E, A>
    <E, A>(effect: Fiber<E, A>, __trace?: string): Effect<never, E, A>
  }

  export const Adapter: Adapter = <R, E, A>(
    tag: Context.Tag<R> | Future<R, E, A> | FiberRef<R, E, A> | Fiber<E, A>,
    __trace?: string,
  ): any => {
    if (Context.isTag(tag)) {
      return withContext<R, never, never, R>(flow(Context.unsafeGet(tag), now)).traced(__trace)
    }

    if (isFuture<R, E, A>(tag)) {
      return wait(tag).traced(__trace)
    }

    if (isFiber<E, A>(tag)) {
      return tag.join.traced(__trace)
    }

    if (isFiberRef(tag)) {
      // TODO: Handle getting FiberRef
    }

    throw new Error(`Invalid adapter: ${JSON.stringify(tag, null, 2)}\n${__trace}`)
  }

  export type Instruction =
    | Ensuring<any, any, any, any, any, any>
    | FlatMap<any, any, any, any, any, any>
    | FromCause<any>
    | FromLazy<any>
    | Lazy<any, any, any>
    | Map<any, any, any, any>
    | MapCause<any, any, any, any>
    | Match<any, any, any, any, any, any, any, any, any>
    | Now<any>
    | OrElseCause<any, any, any, any, any, any>
    | ProvideContext<any, any, any>
    | ProvideTrace<any, any, any>
    | Tap<any, any, any, any, any, any>
    | TapCause<any, any, any, any, any, any>
    | Wait<any, any, any>
    | WithContext<any, any, any, any>
    | WithPlatform<any, any, any>
}

export const instr = <T extends string>(tag: T) =>
  class Instr<I, R, E, A> implements Effect<R, E, A> {
    constructor(readonly input: I) {}

    static tag: T = tag
    readonly tag: T = tag;

    readonly [Effect.TypeId] = Effect.Variance;
    readonly [Symbol.iterator] = () => new SingleShotGen<this, A>(this)
    readonly traced = (trace?: string): Effect<R, E, A> =>
      trace ? new ProvideTrace([this, trace]) : this
  }

export class ProvideTrace<R, E, A> extends instr('ProvideTrace')<
  readonly [Effect<R, E, A>, string],
  R,
  E,
  A
> {}

export class WithPlatform<R, E, A> extends instr('WithPlaftorm')<
  (platform: Platform) => Effect<R, E, A>,
  R,
  E,
  A
> {}

export class WithContext<R, R2, E, A> extends instr('WithContext')<
  (ctx: Context.Context<R>) => Effect<R2, E, A>,
  R | R2,
  E,
  A
> {}

export class ProvideContext<R, E, A> extends instr('ProvideContext')<
  readonly [Effect<R, E, A>, Context.Context<R>],
  never,
  E,
  A
> {}

export class Now<A> extends instr('Now')<A, never, never, A> {}

export class FromLazy<A> extends instr('FromLazy')<() => A, never, never, A> {}

export class FromCause<E> extends instr('FromCause')<Cause<E>, never, E, never> {}

export class Lazy<R, E, A> extends instr('Lazy')<() => Effect<R, E, A>, R, E, A> {}

export class Wait<R, E, A> extends instr('Wait')<Future<R, E, A>, R, E, A> {}

export class Tap<R, E, A, R2, E2, B> extends instr('Tap')<
  readonly [Effect<R, E, A>, (value: A) => Effect<R2, E2, B>],
  R | R2,
  E | E2,
  A
> {}

export class Map<R, E, A, B> extends instr('Map')<
  readonly [Effect<R, E, A>, (value: A) => B],
  R,
  E,
  B
> {}

export class FlatMap<R, E, A, R2, E2, B> extends instr('FlatMap')<
  readonly [Effect<R, E, A>, (value: A) => Effect<R2, E2, B>],
  R | R2,
  E | E2,
  B
> {}

export class TapCause<R, E, A, R2, E2, B> extends instr('Tap')<
  readonly [Effect<R, E, A>, (cause: Cause<E>) => Effect<R2, E2, B>],
  R | R2,
  E | E2,
  A
> {}

export class MapCause<R, E, A, E2> extends instr('MapCause')<
  readonly [Effect<R, E, A>, (cause: Cause<E>) => Cause<E2>],
  R,
  E2,
  A
> {}

export class OrElseCause<R, E, A, R2, E2, A2> extends instr('OrElse')<
  readonly [Effect<R, E, A>, (cause: Cause<E>) => Effect<R2, E2, A2>],
  R | R2,
  E2,
  A | A2
> {}

export class Match<R, E, A, R2, E2, B, R3, E3, C> extends instr('Match')<
  readonly [
    Effect<R, E, A>,
    (cause: Cause<E>) => Effect<R2, E2, B>,
    (value: A) => Effect<R3, E3, C>,
  ],
  R | R2 | R3,
  E2 | E3,
  B | C
> {}

export class Ensuring<R, E, A, R2, E2, B> extends instr('Ensuring')<
  readonly [Effect<R, E, A>, (exit: Exit<E, A>) => Effect<R2, E2, B>],
  R | R2,
  E | E2,
  A
> {}

export const withPlatform = <R, E, A>(
  f: (platform: Platform) => Effect<R, E, A>,
  __trace?: string,
): Effect<R, E, A> => new WithPlatform(f).traced(__trace)

export const provideTrace =
  (trace?: string) =>
  <R, E, A>(effect: Effect<R, E, A>): Effect<R, E, A> =>
    effect.traced(trace)

export const withContext = <R = never, R2 = never, E = never, A = unknown>(
  f: (ctx: Context.Context<R>) => Effect<R2, E, A>,
  __trace?: string,
): Effect<R | R2, E, A> => new WithContext(f).traced(__trace)

export const ask = Effect.Adapter

export const provideContext =
  <R>(ctx: Context.Context<R>, __trace?: string) =>
  <E, A>(effect: Effect<R, E, A>): Effect<never, E, A> =>
    new ProvideContext([effect, ctx]).traced(__trace)

export const now = <A>(value: A, __trace?: string): Effect<never, never, A> =>
  new Now(value).traced(__trace)

export const fromLazy = <A>(f: () => A, __trace?: string): Effect<never, never, A> =>
  new FromLazy(f).traced(__trace)

export const fromCause = <E, A>(cause: Cause<E>, __trace?: string): Effect<never, E, A> =>
  new FromCause(cause).traced(__trace)

export const lazy = <R, E, A>(f: () => Effect<R, E, A>, __trace?: string): Effect<R, E, A> =>
  new Lazy(f).traced(__trace)

export const wait = <R, E, A>(future: Future<R, E, A>, __trace?: string): Effect<R, E, A> =>
  new Wait(future).traced(__trace)
