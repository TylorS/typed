import * as Context from '@fp-ts/data/Context'
import { isLeft } from '@fp-ts/data/Either'
import { flow, identity, pipe } from '@fp-ts/data/Function'
import * as O from '@fp-ts/data/Option'
import * as Cause from '@typed/cause'
import { Exit } from '@typed/exit'
import { SingleShotGen } from '@typed/internal'
import { UnixTime } from '@typed/time'
import * as T from '@typed/trace'

import type { LiveFiber } from '../fiber/Fiber.js'
import type { FiberRefs } from '../fiberRefs/fiberRefs.js'
import type { Future } from '../future/future.js'
import type { Platform } from '../platform/index.js'
import type { RuntimeFlags } from '../runtimeFlags/RuntimeFlags.js'
import type { RuntimeOptions } from '../runtimeOptions/index.js'

export interface Effect<R, E, A> extends Effect.Variance<R, E, A> {
  readonly [Symbol.iterator]: () => Generator<Effect<R, E, A>, A, A>

  readonly tap: <R2, E2, B>(
    f: (a: A) => Effect<R2, E2, B>,
    __trace?: string,
  ) => Effect<R | R2, E | E2, A>

  readonly tapCause: <R2, E2, B>(
    f: (a: Cause.Cause<E>) => Effect<R2, E2, B>,
    __trace?: string,
  ) => Effect<R | R2, E | E2, A>

  readonly map: <B>(f: (a: A) => B, __trace?: string) => Effect<R, E, B>

  readonly as: <B>(b: B, __trace?: string) => Effect<R, E, B>

  readonly mapCause: <E2>(
    f: (e: Cause.Cause<E>) => Cause.Cause<E2>,
    __trace?: string,
  ) => Effect<R, E2, A>

  readonly flatMap: <R2, E2, B>(
    f: (a: A) => Effect<R2, E2, B>,
    __trace?: string,
  ) => Effect<R | R2, E | E2, B>

  readonly orElseCause: <R2, E2, B>(
    f: (e: Cause.Cause<E>) => Effect<R2, E2, B>,
    __trace?: string,
  ) => Effect<R | R2, E2, A | B>

  readonly matchCause: <R2, E2, B, R3, E3, C>(
    onFailure: (e: Cause.Cause<E>) => Effect<R2, E2, B>,
    onSuccess: (a: A) => Effect<R3, E3, C>,
    __trace?: string,
  ) => Effect<R | R2 | R3, E2 | E3, B | C>

  readonly ensuring: <R2, E2, B>(
    finalizer: (e: Exit<E, A>) => Effect<R2, E2, B>,
    __trace?: string,
  ) => Effect<R | R2, E | E2, A>

  readonly causedBy: <E2>(cause: Cause.Cause<E2>) => Effect<R, E | E2, never>

  readonly fork: (
    options?: Partial<RuntimeOptions<R>>,
    __trace?: string,
  ) => Effect<R, never, LiveFiber<E, A>>

  readonly traced: (trace?: string) => Effect<R, E, A>

  readonly provideContext: (context: Context.Context<R>, __trace?: string) => Effect<never, E, A>

  readonly provideService: <S>(
    tag: Context.Tag<S>,
    service: S,
    __trace?: string,
  ) => Effect<Exclude<R, S>, E, A>

  readonly provideFiberRefs: (fiberRefs: FiberRefs, __trace?: string) => Effect<R, E, A>

  readonly provideRuntimeFlags: (flags: RuntimeFlags, __trace?: string) => Effect<R, E, A>

  readonly is: <T extends { new (input: any): Effect.Instruction; readonly _tag: string }>(
    effect: T,
  ) => this is InstanceType<T>
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
      (cause) => runGen(gen, gen.throw(new Cause.CauseError(cause))),
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

  export interface Of<A> extends Effect<never, never, A> {}
  export interface IO<E, A> extends Effect<never, E, A> {}
  export interface RIO<R, A> extends Effect<R, never, A> {}

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
  }

  export const Adapter: Adapter = <R>(
    tag: Context.Tag<R>,
    __trace?: string,
  ): Effect<R, never, R> => {
    if (Context.isTag(tag)) {
      return ask<R>(tag, __trace)
    }

    throw new Error(`Cannot adapt ${JSON.stringify(tag, null, 2)}\n${__trace}`)
  }

  export interface Trace {
    readonly execution: T.Trace
    readonly stack: T.Trace
    readonly time: UnixTime
  }

  export type Instruction =
    | Ensuring<any, any, any, any, any, any>
    | FlatMap<any, any, any, any, any, any>
    | Fork<any, any, any>
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
    | ProvideRuntimeFlags<any, any, any>
    | ProvideTrace<any, any, any>
    | Tap<any, any, any, any, any, any>
    | TapCause<any, any, any, any, any, any>
    | Wait<any, any, any>
    | WithContext<any, any, any, any>
    | WithCurrentFiber<any, any, any>
    | WithFiberRefs<any, any, any>
    | WithPlatform<any, any, any>
    | WithRuntimeFlags<any, any, any>
    | WithRuntimeOptions<any, any, any>
}

const instr = <T extends string, StackType extends 'execution' | 'stack'>(
  tag: T,
  type: StackType,
) =>
  class Instr<I, R, E, A> implements Effect<R, E, A> {
    constructor(readonly input: I) {}

    static _tag: T = tag
    readonly _tag: T = tag

    static _type: StackType = type
    readonly _type: StackType = type;

    readonly [Effect.TypeId] = Effect.Variance as Effect.Variance<R, E, A>[Effect.TypeId];
    readonly [Symbol.iterator] = (): Generator<Effect<R, E, A>, A, A> =>
      new SingleShotGen<Effect<R, E, A>, A>(this)

    readonly tap: Effect<R, E, A>['tap'] = (f, __trace) => new Tap([this, f]).traced(__trace)

    readonly tapCause: Effect<R, E, A>['tapCause'] = (f, __trace) =>
      new TapCause([this, f]).traced(__trace)

    readonly map: Effect<R, E, A>['map'] = (f, __trace) => Map.make(this, f).traced(__trace)

    readonly as: Effect<R, E, A>['as'] = (b, __trace) => this.map(() => b, __trace)

    readonly mapCause: Effect<R, E, A>['mapCause'] = (f, __trace) =>
      new MapCause([this, f]).traced(__trace)

    readonly flatMap: Effect<R, E, A>['flatMap'] = (f, __trace) =>
      new FlatMap([this, f]).traced(__trace)

    readonly matchCause: Effect<R, E, A>['matchCause'] = (failure, success, __trace) =>
      new MatchCause([this, failure, success]).traced(__trace)

    readonly orElseCause: Effect<R, E, A>['orElseCause'] = (f, __trace) =>
      new OrElseCause([this, f]).traced(__trace)

    readonly ensuring: Effect<R, E, A>['ensuring'] = (f, __trace) =>
      new Ensuring([this, f]).traced(__trace)

    readonly causedBy: Effect<R, E, A>['causedBy'] = (cause) =>
      this.matchCause(
        (cause2) => fromCause(Cause.Sequential(cause2, cause)),
        () => fromCause(cause),
      )

    readonly fork: Effect<R, E, A>['fork'] = (options, __trace?) =>
      new Fork([this, options]).traced(__trace)

    readonly traced: Effect<R, E, A>['traced'] = (trace) =>
      trace ? new ProvideTrace([this, T.custom(trace), type]) : this

    readonly provideContext: Effect<R, E, A>['provideContext'] = (context, __trace) =>
      new ProvideContext<R, E, A>([this, context]).traced(__trace)

    readonly provideService: Effect<R, E, A>['provideService'] = <S>(
      tag: Context.Tag<S>,
      service: S,
      __trace?: string,
    ) =>
      new WithContext((ctx: Context.Context<Exclude<R, S>>) =>
        this.provideContext(Context.add(tag)(service)(ctx as Context.Context<R>)),
      ).traced(__trace)

    readonly provideFiberRefs: Effect<R, E, A>['provideFiberRefs'] = (fiberRefs, __trace?) =>
      new ProvideFiberRefs([this, fiberRefs]).traced(__trace)

    readonly provideRuntimeFlags: Effect<R, E, A>['provideRuntimeFlags'] = (flags, __trace?) =>
      new ProvideRuntimeFlags([this, flags]).traced(__trace)

    /**
     * Intended for checking if an effect is a specific instruction type
     *
     * @internal
     */
    readonly is: Effect<R, E, A>['is'] = (effect) => this._tag === effect._tag
  }

export class ProvideTrace<R, E, A> extends instr('ProvideTrace', 'stack')<
  readonly [Effect<R, E, A>, T.Trace, 'execution' | 'stack'],
  R,
  E,
  A
> {}

export class WithEffectTrace<R, E, A> extends instr('WithEffectTrace', 'stack')<
  (trace: Effect.Trace) => Effect<R, E, A>,
  R,
  E,
  A
> {}

export class WithPlatform<R, E, A> extends instr('WithPlatform', 'stack')<
  (platform: Platform) => Effect<R, E, A>,
  R,
  E,
  A
> {}

export class WithContext<R, R2, E, A> extends instr('WithContext', 'stack')<
  (ctx: Context.Context<R>) => Effect<R2, E, A>,
  R | R2,
  E,
  A
> {}

export class ProvideContext<R, E, A> extends instr('ProvideContext', 'stack')<
  readonly [Effect<R, E, A>, Context.Context<R>],
  never,
  E,
  A
> {}

export class WithFiberRefs<R, E, A> extends instr('WithFiberRefs', 'stack')<
  (fiberRefs: FiberRefs) => Effect<R, E, A>,
  R,
  E,
  A
> {}

export class ProvideFiberRefs<R, E, A> extends instr('ProvideFiberRefs', 'stack')<
  readonly [Effect<R, E, A>, FiberRefs],
  R,
  E,
  A
> {}

export class WithRuntimeFlags<R, E, A> extends instr('WithRuntimeFlags', 'stack')<
  (flags: RuntimeFlags) => Effect<R, E, A>,
  R,
  E,
  A
> {}

export class ProvideRuntimeFlags<R, E, A> extends instr('ProvideRuntimeFlags', 'stack')<
  readonly [Effect<R, E, A>, RuntimeFlags],
  R,
  E,
  A
> {}

export class WithRuntimeOptions<R, E, A> extends instr('WithRuntimeOptions', 'stack')<
  (options: RuntimeOptions<R>) => Effect<R, E, A>,
  R,
  E,
  A
> {}

export class WithCurrentFiber<R, E, A> extends instr('WithCurrentFiber', 'stack')<
  (fiber: LiveFiber<unknown, unknown>) => Effect<R, E, A>,
  R,
  E,
  A
> {}

export class Now<A> extends instr('Now', 'execution')<A, never, never, A> {}

export class FromLazy<A> extends instr('FromLazy', 'execution')<() => A, never, never, A> {}

export class FromCause<E> extends instr('FromCause', 'execution')<
  Cause.Cause<E>,
  never,
  E,
  never
> {}

export class Lazy<R, E, A> extends instr('Lazy', 'stack')<() => Effect<R, E, A>, R, E, A> {}

export class Wait<R, E, A> extends instr('Wait', 'execution')<Future<R, E, A>, R, E, A> {}

export class Tap<R, E, A, R2, E2, B> extends instr('Tap', 'stack')<
  readonly [Effect<R, E, A>, (value: A) => Effect<R2, E2, B>],
  R | R2,
  E | E2,
  A
> {}

export class Map<R, E, A, B> extends instr('Map', 'stack')<
  readonly [Effect<R, E, A>, (value: A) => B],
  R,
  E,
  B
> {
  static make = <R, E, A, B>(effect: Effect<R, E, A>, f: (value: A) => B): Effect<R, E, B> => {
    if (effect.is<typeof Map<R, E, any, A>>(Map)) {
      const [effect2, f2] = effect.input

      return new Map([effect2, flow(f2, f)])
    } else if (effect.is<typeof Now<A>>(Now)) {
      return new Now(f(effect.input))
    }

    return new Map([effect, f])
  }
}

export class FlatMap<R, E, A, R2, E2, B> extends instr('FlatMap', 'stack')<
  readonly [Effect<R, E, A>, (value: A) => Effect<R2, E2, B>],
  R | R2,
  E | E2,
  B
> {}

export class TapCause<R, E, A, R2, E2, B> extends instr('Tap', 'stack')<
  readonly [Effect<R, E, A>, (cause: Cause.Cause<E>) => Effect<R2, E2, B>],
  R | R2,
  E | E2,
  A
> {}

export class MapCause<R, E, A, E2> extends instr('MapCause', 'stack')<
  readonly [Effect<R, E, A>, (cause: Cause.Cause<E>) => Cause.Cause<E2>],
  R,
  E2,
  A
> {}

export class OrElseCause<R, E, A, R2, E2, A2> extends instr('OrElse', 'stack')<
  readonly [Effect<R, E, A>, (cause: Cause.Cause<E>) => Effect<R2, E2, A2>],
  R | R2,
  E2,
  A | A2
> {}

export class MatchCause<R, E, A, R2, E2, B, R3, E3, C> extends instr('Match', 'stack')<
  readonly [
    Effect<R, E, A>,
    (cause: Cause.Cause<E>) => Effect<R2, E2, B>,
    (value: A) => Effect<R3, E3, C>,
  ],
  R | R2 | R3,
  E2 | E3,
  B | C
> {}

export class Ensuring<R, E, A, R2, E2, B> extends instr('Ensuring', 'stack')<
  readonly [Effect<R, E, A>, (exit: Exit<E, A>) => Effect<R2, E2, B>],
  R | R2,
  E | E2,
  A
> {}

export class Fork<R, E, A> extends instr('Fork', 'stack')<
  readonly [Effect<R, E, A>, Partial<RuntimeOptions<R>>?],
  R,
  never,
  LiveFiber<E, A>
> {}

export const withPlatform = <R, E, A>(
  f: (platform: Platform) => Effect<R, E, A>,
  __trace?: string,
): Effect<R, E, A> => new WithPlatform(f).traced(__trace)

export const traced =
  (trace?: string) =>
  <R, E, A>(effect: Effect<R, E, A>): Effect<R, E, A> =>
    effect.traced(trace)

export const withContext = <R = never, R2 = never, E = never, A = unknown>(
  f: (ctx: Context.Context<R>) => Effect<R2, E, A>,
  __trace?: string,
): Effect<R | R2, E, A> => new WithContext(f).traced(__trace)

export const ask: <R>(tag: Context.Tag<R>, __trace?: string) => Effect<R, never, R> = (
  tag,
  __trace,
) => withContext(flow(Context.unsafeGet(tag), now), __trace)

export const asks =
  <R>(tag: Context.Tag<R>) =>
  <A>(f: (r: R) => A, __trace?: string): Effect<R, never, A> =>
    withContext(
      (ctx: Context.Context<R>) => fromLazy(() => pipe(ctx, Context.unsafeGet<R>(tag), f)),
      __trace,
    )

export const asksEffect =
  <R>(tag: Context.Tag<R>) =>
  <A, R2, E2>(f: (r: R) => Effect<R2, E2, A>, __trace?: string): Effect<R | R2, E2, A> =>
    withContext(flow(Context.unsafeGet<R>(tag), f), __trace)

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

export const fromCause = <E>(cause: Cause.Cause<E>, __trace?: string): Effect<never, E, never> =>
  new FromCause(cause).traced(__trace)

export const fromExit = <E, A>(exit: Exit<E, A>, __trace?: string): Effect<never, E, A> =>
  isLeft(exit) ? fromCause(exit.left, __trace) : now(exit.right, __trace)

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
    Map.make(effect, f).traced(__trace)

export const flatMap =
  <A, R2, E2, B>(f: (value: A) => Effect<R2, E2, B>, __trace?: string) =>
  <R, E>(effect: Effect<R, E, A>): Effect<R | R2, E | E2, B> =>
    new FlatMap([effect, f]).traced(__trace)

export const tapCause =
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Effect<R2, E2, B>, __trace?: string) =>
  <R, A>(effect: Effect<R, E, A>): Effect<R | R2, E | E2, A> =>
    new TapCause([effect, f]).traced(__trace)

export const mapCause =
  <E, E2>(f: (cause: Cause.Cause<E>) => Cause.Cause<E2>, __trace?: string) =>
  <R, A>(effect: Effect<R, E, A>): Effect<R, E2, A> =>
    new MapCause([effect, f]).traced(__trace)

export const orElseCause =
  <E, R2, E2, A2>(f: (cause: Cause.Cause<E>) => Effect<R2, E2, A2>, __trace?: string) =>
  <R, A>(effect: Effect<R, E, A>): Effect<R | R2, E2, A | A2> =>
    new OrElseCause([effect, f]).traced(__trace)

export const matchCause =
  <E, R2, E2, B, A, R3, E3, C>(
    onCause: (cause: Cause.Cause<E>) => Effect<R2, E2, B>,
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

export const onInterrupt =
  <R2, E2, B>(f: (i: Cause.Interrupted) => Effect<R2, E2, B>, __trace?: string) =>
  <R, E, A>(effect: Effect<R, E, A>): Effect<R | R2, E | E2, A> =>
    pipe(
      effect,
      matchCause(
        (cause) =>
          pipe(
            cause,
            Cause.findInterrupted,
            O.match(
              () => fromCause(cause),
              (i) => f(i).causedBy(cause),
            ),
          ),
        now,
        __trace,
      ),
    )

// TODO: Race + Zip
// TODO: Logging, level, spans, annotations
