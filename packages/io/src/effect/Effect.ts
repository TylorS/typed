import * as Context from '@fp-ts/data/Context'
import { flow, identity } from '@fp-ts/data/Function'
import { Cause, CauseError } from '@typed/cause'
import { Exit } from '@typed/exit'
import { SingleShotGen } from '@typed/internal'

import { FiberRef, isFiberRef } from '../fiberRef/fiberRef.js'
import type { FiberRefs } from '../fiberRefs/fiberRefs.js'
import { Future, isFuture } from '../future/future.js'
import { Platform } from '../platform/index.js'

export interface Effect<R, E, A> extends Effect.Variance<R, E, A> {
  readonly [Symbol.iterator]: () => Generator<Effect<R, E, A>, A, A>

  // TODO: Add ControlFlow methods

  readonly traced: (trace?: string) => Effect<R, E, A>
  readonly provideContext: (context: Context.Context<R>, __trace?: string) => Effect<never, E, A>
  readonly provideService: <S>(
    tag: Context.Tag<S>,
    service: S,
    __trace?: string,
  ) => Effect<Exclude<R, S>, E, A>
  readonly provideFiberRefs: (fiberRefs: FiberRefs, __trace?: string) => Effect<R, E, A>
}

export function Effect<Y extends Effect<any, any, any>, R, N>(
  f: (adapter: Effect.Adapter) => Generator<Y, R, N>,
  __trace?: string,
): Effect<Effect.ResourcesOf<Y>, Effect.ErrorsOf<Y>, R> {
  return new Lazy<Effect.ResourcesOf<Y>, Effect.ErrorsOf<Y>, R>(() => {
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

export type ResourcesOf<T> = Effect.ResourcesOf<T>
export type ErrorsOf<T> = Effect.ErrorsOf<T>
export type ValueOf<T> = Effect.ValueOf<T>

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

  export type ValueOf<T> = [T] extends [never]
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
  }

  export const Adapter: Adapter = <R, E, A>(
    tag: Context.Tag<R> | Future<R, E, A> | FiberRef<R, E, A>,
    __trace?: string,
  ): any => {
    if (Context.isTag(tag)) {
      return new WithContext<R, never, never, R>(flow(Context.unsafeGet(tag), now)).traced(__trace)
    }

    if (isFuture<R, E, A>(tag)) {
      return new Wait(tag).traced(__trace)
    }

    if (isFiberRef<R, E, A>(tag)) {
      return new WithFiberRefs((refs) => refs.get(tag)).traced(__trace)
    }

    throw new Error(`Cannot adapt ${JSON.stringify(tag, null, 2)}\n${__trace}`)
  }

  // TODO: Runtime Flags, With/Provide
  // TODO: Fork, WithCurrentFiber
  // TODO: WithStackTrace, + types for Execution + Stack traces
  // TODO: Platform needs a Cause Renderer
  // TODO: ...

  export type Instruction =
    | Ensuring<any, any, any, any, any, any>
    | FlatMap<any, any, any, any, any, any>
    | FromCause<any>
    | FromLazy<any>
    | Lazy<any, any, any>
    | Map<any, any, any, any>
    | MapCause<any, any, any, any>
    | MatchCause<any, any, any, any, any, any, any, any, any>
    | Now<any>
    | OrElseCause<any, any, any, any, any, any>
    | ProvideContext<any, any, any>
    | ProvideFiberRefs<any, any, any>
    | ProvideTrace<any, any, any>
    | Tap<any, any, any, any, any, any>
    | TapCause<any, any, any, any, any, any>
    | Wait<any, any, any>
    | WithContext<any, any, any, any>
    | WithFiberRefs<any, any, any>
    | WithPlatform<any, any, any>
}

export const instr = <T extends string>(tag: T) =>
  class Instr<I, R, E, A> implements Effect<R, E, A> {
    constructor(readonly input: I) {}

    static _tag: T = tag
    readonly _tag: T = tag;

    readonly [Effect.TypeId] = Effect.Variance;
    readonly [Symbol.iterator] = () => new SingleShotGen<this, A>(this)

    readonly traced = (trace?: string): Effect<R, E, A> =>
      trace ? new ProvideTrace([this, trace]) : this

    readonly provideContext = (
      context: Context.Context<R>,
      __trace?: string,
    ): Effect<never, E, A> => new ProvideContext<R, E, A>([this, context]).traced(__trace)

    readonly provideService = <S>(
      tag: Context.Tag<S>,
      service: S,
      __trace?: string,
    ): Effect<Exclude<R, S>, E, A> =>
      new WithContext((ctx: Context.Context<Exclude<R, S>>) =>
        this.provideContext(Context.add(tag)(service)(ctx as Context.Context<R>)),
      ).traced(__trace)

    readonly provideFiberRefs = (fiberRefs: FiberRefs, __trace?: string): Effect<R, E, A> =>
      new ProvideFiberRefs<R, E, A>([this, fiberRefs]).traced(__trace)
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

export class WithFiberRefs<R, E, A> extends instr('WithFiberRefs')<
  (fiberRefs: FiberRefs) => Effect<R, E, A>,
  R,
  E,
  A
> {}

export class ProvideFiberRefs<R, E, A> extends instr('ProvideFiberRefs')<
  readonly [Effect<R, E, A>, FiberRefs],
  R,
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

export class MatchCause<R, E, A, R2, E2, B, R3, E3, C> extends instr('Match')<
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

export const ask: <R>(tag: Context.Tag<R>, __trace?: string) => Effect<R, never, R> = Effect.Adapter

export const provideContext =
  <R>(ctx: Context.Context<R>, __trace?: string) =>
  <E, A>(effect: Effect<R, E, A>): Effect<never, E, A> =>
    new ProvideContext([effect, ctx]).traced(__trace)

export const withFiberRefs = <R, E, A>(
  f: (refs: FiberRefs) => Effect<R, E, A>,
  __trace?: string,
): Effect<R, E, A> => new WithFiberRefs(f).traced(__trace)

export const provideFiberRefs =
  (refs: FiberRefs, __trace?: string) =>
  <R, E, A>(effect: Effect<R, E, A>): Effect<R, E, A> =>
    new ProvideFiberRefs([effect, refs]).traced(__trace)

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

export const tap =
  <A, R2, E2, B>(f: (value: A) => Effect<R2, E2, B>, __trace?: string) =>
  <R, E>(effect: Effect<R, E, A>): Effect<R | R2, E | E2, A> =>
    new Tap([effect, f]).traced(__trace)

export const map =
  <A, B>(f: (value: A) => B, __trace?: string) =>
  <R, E>(effect: Effect<R, E, A>): Effect<R, E, B> =>
    new Map([effect, f]).traced(__trace)

export const flatMap =
  <A, R2, E2, B>(f: (value: A) => Effect<R2, E2, B>, __trace?: string) =>
  <R, E>(effect: Effect<R, E, A>): Effect<R | R2, E | E2, B> =>
    new FlatMap([effect, f]).traced(__trace)

export const tapCause =
  <E, R2, E2, B>(f: (cause: Cause<E>) => Effect<R2, E2, B>, __trace?: string) =>
  <R, A>(effect: Effect<R, E, A>): Effect<R | R2, E | E2, A> =>
    new TapCause([effect, f]).traced(__trace)

export const mapCause =
  <E, E2>(f: (cause: Cause<E>) => Cause<E2>, __trace?: string) =>
  <R, A>(effect: Effect<R, E, A>): Effect<R, E2, A> =>
    new MapCause([effect, f]).traced(__trace)

export const orElseCause =
  <E, R2, E2, A2>(f: (cause: Cause<E>) => Effect<R2, E2, A2>, __trace?: string) =>
  <R, A>(effect: Effect<R, E, A>): Effect<R | R2, E2, A | A2> =>
    new OrElseCause([effect, f]).traced(__trace)

export const matchCause =
  <E, R2, E2, B, A, R3, E3, C>(
    onCause: (cause: Cause<E>) => Effect<R2, E2, B>,
    onValue: (value: A) => Effect<R3, E3, C>,
    __trace?: string,
  ) =>
  <R>(effect: Effect<R, E, A>): Effect<R | R2 | R3, E2 | E3, B | C> =>
    new MatchCause([effect, onCause, onValue]).traced(__trace)

export const ensuring =
  <E, A, R2, E2, B>(
    f: (exit: Exit<E, A>) => Effect<R2, E2, B>,
    __trace?: string,
  ): (<R>(effect: Effect<R, E, A>) => Effect<R | R2, E | E2, A>) =>
  (effect) =>
    new Ensuring([effect, f]).traced(__trace)
