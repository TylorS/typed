import * as Chunk from "@effect/data/Chunk"
import * as Equal from "@effect/data/Equal"
import type { Equivalence } from "@effect/data/Equivalence"
import { identity } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import type { Option } from "@effect/data/Option"
import { pipeArguments } from "@effect/data/Pipeable"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type * as Layer from "@effect/io/Layer"
import type * as Schedule from "@effect/io/Schedule"
import type * as Context from "@typed/context"
import { type InternalEffect, OpCodes as EffectOpCodes } from "@typed/fx/internal/effect-primitive"
import type { FlattenStrategy, Fx, Operator } from "@typed/fx/internal/fx-primitive"
import * as Primitive from "@typed/fx/internal/fx-primitive"
import type { Sink } from "@typed/fx/internal/sink"

const Variance = {
  _R: identity,
  _E: identity,
  _A: identity
}

// TODO: AcquireUseRelease
// TODO: Ensuring ?
// TODO: Provide Layer/Context, we should be able to optimize these together in many cases

export type FxPrimitive =
  | CombineImpl<any>
  | EmptyImpl
  | FailCauseImpl<any>
  | FromEffectImpl<any, any, any>
  | FromSinkImpl<any, any, any>
  | MergeImpl<any>
  | NeverImpl
  | OperatorImpl<any, any, any>
  | RaceImpl<any>
  | ScheduledImpl<any, any, any>
  | SucceedImpl<any>
  | Suspend<any, any, any>
  | SyncImpl<any>

export abstract class BaseFx<R, E, A> implements Fx<R, E, A> {
  abstract readonly _tag: string
  readonly [Primitive.TypeId]: Fx<R, E, A>[Primitive.TypeId] = Variance

  constructor(
    readonly i0?: unknown,
    readonly i1?: unknown,
    readonly i2?: unknown
  ) {}

  [Equal.symbol](this: {}, that: unknown) {
    return this === that
  }
  [Hash.symbol](this: {}) {
    return Hash.random(this)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }
}

export class SucceedImpl<A> extends BaseFx<never, never, A> {
  readonly _tag = "Fx/Succeed"

  constructor(
    i0: A
  ) {
    super(i0)
  }
}

export class SyncImpl<A> extends BaseFx<never, never, A> {
  readonly _tag = "Fx/Sync"

  constructor(
    i0: () => A
  ) {
    super(i0)
  }
}

export class Suspend<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/Suspend"

  constructor(
    i0: () => Fx<R, E, A>
  ) {
    super(i0)
  }
}

export class FailCauseImpl<E> extends BaseFx<never, E, never> {
  readonly _tag = "Fx/FailCause"

  constructor(
    i0: Cause.Cause<E>
  ) {
    super(i0)
  }
}

export class EmptyImpl extends BaseFx<never, never, never> {
  readonly _tag = "Fx/Empty"
}

export class NeverImpl extends BaseFx<never, never, never> {
  readonly _tag = "Fx/Never"
}

export class FromSinkImpl<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/FromSink"

  constructor(
    i0: (sink: Sink<E, A>) => Effect.Effect<R, never, unknown>
  ) {
    super(i0)
  }
}

export class FromEffectImpl<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/FromEffect"

  constructor(
    i0: Effect.Effect<R, E, A>
  ) {
    super(i0)
  }
}

export class CombineImpl<FX extends ReadonlyArray<Fx<any, any, any>>> extends BaseFx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  { readonly [K in keyof FX]: Fx.Success<FX[K]> }
> {
  readonly _tag = "Fx/Combine"

  constructor(
    i0: FX
  ) {
    super(i0)
  }

  static make<FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }> {
    // TODO: Convert empty/never to empty/never
    return new CombineImpl(fxs)
  }
}

export class MergeImpl<FX extends ReadonlyArray<Fx<any, any, any>>> extends BaseFx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  readonly _tag = "Fx/Merge"

  constructor(
    i0: FX,
    i1: Primitive.MergeStrategy
  ) {
    super(i0, i1)
  }

  static make<FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX,
    strategy: Primitive.MergeStrategy
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> {
    // TODO: Filter out empty/never Fx

    return new MergeImpl(fxs, strategy)
  }
}

export class RaceImpl<FX extends ReadonlyArray<Fx<any, any, any>>> extends BaseFx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  readonly _tag = "Fx/Race"

  constructor(
    i0: FX
  ) {
    super(i0)
  }
}

export class ScheduledImpl<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/Scheduled"

  constructor(
    i0: Effect.Effect<unknown, unknown, unknown>,
    i1: Schedule.Schedule<unknown, unknown, unknown>
  ) {
    super(i0, i1)
  }
}

export interface OperatorOptions {
  readonly operators: Chunk.Chunk<Operator>
  readonly startWith: Chunk.Chunk<any>
  readonly endWith: Chunk.Chunk<any>
  readonly context: Context.Context<any> | undefined
  readonly layer: Layer.Layer<any, any, any> | undefined
}

const emptyChunk = Chunk.empty()

export function OperatorOptions(
  options: Partial<OperatorOptions>
): OperatorOptions {
  return {
    operators: options.operators || emptyChunk,
    startWith: options.startWith || emptyChunk,
    endWith: options.endWith || emptyChunk,
    context: options.context,
    layer: options.layer
  }
}

export class OperatorImpl<R, E, A> implements Fx<R, E, A> {
  readonly _tag = "Fx/Operator"
  readonly [Primitive.TypeId]: Fx<R, E, A>[Primitive.TypeId] = Variance

  constructor(
    readonly fx: Fx<unknown, unknown, unknown>,
    readonly options: OperatorOptions
  ) {}

  pipe() {
    return pipeArguments(this, arguments)
  }

  static make<R, E, A>(
    fx: Fx<unknown, unknown, unknown>,
    operators: Operator
  ): OperatorImpl<R, E, A> {
    // TODO: Implement operator optimizations
    return new OperatorImpl(
      fx,
      OperatorOptions({
        operators: Chunk.of(operators)
      })
    )
  }

  static startWith<R, E, A>(
    fx: Fx<unknown, unknown, unknown>,
    startWith: A
  ): Fx<R, E, A> {
    return new OperatorImpl(
      fx,
      OperatorOptions({
        startWith: Chunk.of(startWith)
      })
    )
  }

  static endWith<R, E, A>(
    fx: Fx<unknown, unknown, unknown>,
    endWith: A
  ): Fx<R, E, A> {
    return new OperatorImpl(
      fx,
      OperatorOptions({
        endWith: Chunk.of(endWith)
      })
    )
  }

  static provide<R, E, A, R2>(
    fx: Fx<R, E, A>,
    context: Context.Context<R2>
  ): Fx<Exclude<R, R2>, E, A> {
    return new OperatorImpl(
      fx,
      OperatorOptions({
        context
      })
    )
  }

  static provideLayer<R, E, A, R2, E2, S>(
    fx: Fx<R, E, A>,
    layer: Layer.Layer<R2, E2, S>
  ): Fx<Exclude<R, Context.Context<S>> | R2, E | E2, A> {
    return new OperatorImpl(
      fx,
      OperatorOptions({
        layer
      })
    )
  }
}

export function succeed<A>(value: A): Fx<never, never, A> {
  return new SucceedImpl(value)
}

export function fail<E>(error: E): Fx<never, E, never> {
  return new FailCauseImpl(Cause.fail(error))
}

export function failCause<E>(cause: Cause.Cause<E>): Fx<never, E, never> {
  return new FailCauseImpl(cause)
}

export function combine<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  { readonly [K in keyof FX]: Fx.Success<FX[K]> }
> {
  return new CombineImpl(fxs)
}

export function mergeWithStrategy<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX,
  strategy: Primitive.MergeStrategy
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return new MergeImpl(fxs, strategy)
}

export function merge<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return mergeWithStrategy(fxs, Primitive.Unordered(Infinity))
}

export function mergeConcurrently<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX,
  concurrency: number
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return mergeWithStrategy(fxs, Primitive.Unordered(concurrency))
}

export function mergeBufferConcurrently<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX,
  concurrency: number
) {
  return mergeWithStrategy(fxs, Primitive.Ordered(concurrency))
}

export function mergeBuffer<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) {
  return mergeWithStrategy(fxs, Primitive.Ordered(Infinity))
}

export function switchBuffer<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) {
  return mergeWithStrategy(fxs, Primitive.Switch)
}

export function race<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return new RaceImpl(fxs)
}

export function observe<R, E, A, R2, E2, B>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fx: Fx<R, E, A>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSuccess: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2, E | E2, void> {
  return Effect.gen(function*(_) {
    // TODO: Implement
  })
}

export type FxInput<R, E, A> = Effect.Effect<R, E, A> | Cause.Cause<E>

export function fromInput<R = never, E = never, A = never>(input: FxInput<R, E, A>): Fx<R, E, A> {
  const i = input as InternalEffect | Cause.Cause<E>

  switch (i._tag) {
    // Cause
    case "Fail":
    case "Annotated":
    case "Die":
    case "Empty":
    case "Interrupt":
    case "Sequential":
    case "Parallel":
      return new FailCauseImpl(i)
    default:
      return fromEffect(i as Effect.Effect<R, E, A>)
  }
}

export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> {
  const i = effect as InternalEffect

  switch (i._tag) {
    // Effects that transfer directly to Fx
    case EffectOpCodes.OP_SUCCESS:
      return new SucceedImpl(i.i0 as A)
    case EffectOpCodes.OP_SYNC:
      return new SyncImpl(i.i0 as () => A)
    case EffectOpCodes.OP_FAILURE:
      return new FailCauseImpl<E>(i.i0 as Cause.Cause<E>)
    case EffectOpCodes.OP_COMMIT:
      return fromEffect<R, E, A>(i.commit() as Effect.Effect<R, E, A>)
    // Either
    case "Left":
      return new FailCauseImpl(Cause.fail(i.left))
    case "Right":
      return new SucceedImpl(i.right)
    // Option
    case "None":
      return new FailCauseImpl<E>(Cause.fail(Cause.NoSuchElementException() as E))
    case "Some":
      return new SucceedImpl(i.value)
    // Fallback to FromEffect
    default:
      return new FromEffectImpl(effect)
  }
}

export function startWith<R, E, A, B>(
  fx: Fx<R, E, A>,
  b: B
): Fx<R, E, A | B> {
  return OperatorImpl.startWith(fx, b)
}

export function endWith<R, E, A, B>(
  fx: Fx<R, E, A>,
  b: B
): Fx<R, E, A | B> {
  return OperatorImpl.endWith(fx, b)
}

const op = <T extends Primitive.OpCodes>(tag: T) =>
<R, E, A>(
  fx: Fx<unknown, unknown, unknown>,
  body: Omit<Extract<Operator, { readonly _tag: T }>, "_tag">
): Fx<R, E, A> => OperatorImpl.make(fx, { ...body, _tag: tag } as Operator)

const makeMap = op(Primitive.OpCodes.OP_MAP)

export function map<R, E, A, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => B
): Fx<R, E, B> {
  return makeMap(fx, { i0: f })
}

const makeMapEffect = op(Primitive.OpCodes.OP_MAP_EFFECT)

export function mapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx<R | R2, E | E2, B> {
  return makeMapEffect(fx, { i0: f })
}

const makeFlatMap = op(Primitive.OpCodes.OP_FLAT_MAP)

export function flatMapWithStrategy<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  strategy: FlattenStrategy
): Fx<R | R2, E | E2, B> {
  return makeFlatMap(fx, { i0: f, i1: strategy })
}

export function flatMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>
): Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.Unbounded)
}

export function flatMapConcurrently<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  concurrency: number
): Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.Bounded(concurrency))
}

export function switchMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>
): Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.Switch)
}

export function exhaustMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>
): Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.Exhaust)
}

export function exhaustMapLatest<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>
): Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.ExhaustLatest)
}

const makeFlatMapCause = op(Primitive.OpCodes.OP_FLAT_MAP_CAUSE)

export function flatMapCauseWithStrategy<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => Fx<R2, E2, B>,
  strategy: FlattenStrategy
): Fx<R | R2, E2, B> {
  return makeFlatMapCause(fx, { i0: f, i1: strategy })
}

export function flatMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.Unbounded)
}

export function flatMapCauseConcurrently<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => Fx<R2, E2, B>,
  concurrency: number
): Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.Bounded(concurrency))
}

export function switchMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.Switch)
}

export function exhaustMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.Exhaust)
}

export function exhaustMapCauseLatest<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.ExhaustLatest)
}

const makeContinueWith = op(Primitive.OpCodes.OP_CONTINUE_WITH)

export function continueWith<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: () => Fx<R2, E2, B>
): Fx<R | R2, E | E2, A | B> {
  return makeContinueWith(fx, { i0: f })
}

const makeDropAfter = op(Primitive.OpCodes.OP_DROP_AFTER)

export function dropAfter<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return makeDropAfter(fx, { i0: f })
}

const makeDropUntil = op(Primitive.OpCodes.OP_DROP_UNTIL)

export function dropUntil<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return makeDropUntil(fx, { i0: f })
}

const makeDropWhile = op(Primitive.OpCodes.OP_DROP_WHILE)

export function dropWhile<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return makeDropWhile(fx, { i0: f })
}

const makeDuring = op(Primitive.OpCodes.OP_DURING)

export function during<R, E, A, R2, E2, R3, E3, B>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, Fx<R3, E3, B>>
): Fx<R | R2 | R3, E | E2 | E3, A> {
  return makeDuring(fx, { i0: window })
}

const makeFilter = op(Primitive.OpCodes.OP_FILTER)

export function filter<R, E, A>(
  fx: Fx<R, E, A>,
  f: (a: A) => boolean
): Fx<R, E, A> {
  return makeFilter(fx, { i0: f })
}

const makeFilterEffect = op(Primitive.OpCodes.OP_FILTER_EFFECT)

export function filterEffect<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E | E2, A> {
  return makeFilterEffect(fx, { i0: f })
}

const makeFilterMap = op(Primitive.OpCodes.OP_FILTER_MAP)

export function filterMap<R, E, A, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Option<B>
): Fx<R, E, B> {
  return makeFilterMap(fx, { i0: f })
}

const makeFilterMapEffect = op(Primitive.OpCodes.OP_FILTER_MAP_EFFECT)

export function filterMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option<B>>
): Fx<R | R2, E | E2, B> {
  return makeFilterMapEffect(fx, { i0: f })
}

const makeHold = op(Primitive.OpCodes.OP_HOLD)

export function hold<R, E, A>(
  fx: Fx<R, E, A>
): Fx<R, E, A> {
  return makeHold(fx, {})
}

const makeLoop = op(Primitive.OpCodes.OP_LOOP)

export function loop<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  f: (b: B, a: A) => readonly [C, B],
  b: B
): Fx<R, E, C> {
  return makeLoop(fx, { i0: f, i1: b })
}

const makeLoopEffect = op(Primitive.OpCodes.OP_LOOP_EFFECT)

export function loopEffect<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  f: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>,
  b: B
): Fx<R | R2, E | E2, C> {
  return makeLoopEffect(fx, { i0: f, i1: b })
}

const makeMatchCause = op(Primitive.OpCodes.OP_MATCH_CAUSE)

export function matchCauseWithStrategy<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
  strategy: FlattenStrategy
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return makeMatchCause(fx, { i0: f, i1: g, i2: strategy })
}

export function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.Unbounded)
}

export function matchCauseConcurrently<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
  concurrency: number
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.Bounded(concurrency))
}

export function matchCauseSwitch<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.Switch)
}

export function matchCauseExhaust<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.Exhaust)
}

export function matchCauseExhaustLatest<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.ExhaustLatest)
}

const makeMulticast = op(Primitive.OpCodes.OP_MULTICAST)

export function multicast<R, E, A>(
  fx: Fx<R, E, A>
): Fx<R, E, A> {
  return makeMulticast(fx, {})
}

const makeOrElse = op(Primitive.OpCodes.OP_OR_ELSE)

export function orElse<R, E, A, R2, E2, A2>(
  fx: Fx<R, E, A>,
  f: () => Fx<R2, E2, A2>
): Fx<R | R2, E | E2, A | A2> {
  return makeOrElse(fx, { i0: f })
}

const makeSince = op(Primitive.OpCodes.OP_SINCE)

export function since<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  when: Fx<R2, E2, B>
): Fx<R | R2, E | E2, A> {
  return makeSince(fx, { i0: when })
}

const makeSkipRepeats = op(Primitive.OpCodes.OP_SKIP_REPEATS)

export function skipRepeats<R, E, A>(
  fx: Fx<R, E, A>,
  eq: Equivalence<A>
): Fx<R, E, A> {
  return makeSkipRepeats(fx, { i0: eq })
}

const makeTakeUntil = op(Primitive.OpCodes.OP_TAKE_UNTIL)

export function takeUntil<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return makeTakeUntil(fx, { i0: f })
}

const makeTakeWhile = op(Primitive.OpCodes.OP_TAKE_WHILE)

export function takeWhile<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return makeTakeWhile(fx, { i0: f })
}

const makeSlice = op(Primitive.OpCodes.OP_SLICE)

export function slice<R, E, A>(
  fx: Fx<R, E, A>,
  start: number,
  end: number
): Fx<R, E, A> {
  return makeSlice(fx, { i0: start, i1: end })
}

const makeSnapshot = op(Primitive.OpCodes.OP_SNAPSHOT)

export function snapshot<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  sampled: Effect.Effect<R2, E2, B>,
  f: (a: A, b: B) => Effect.Effect<R3, E3, C>
): Fx<R | R2 | R3, E | E2 | E3, C> {
  return makeSnapshot(fx, { i0: sampled, i1: f })
}

const makeTap = op(Primitive.OpCodes.OP_TAP)

export function tap<R, E, A, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => B
): Fx<R, E, A> {
  return makeTap(fx, { i0: f })
}

const makeTapEffect = op(Primitive.OpCodes.OP_TAP_EFFECT)

export function tapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx<R | R2, E | E2, A> {
  return makeTapEffect(fx, { i0: f })
}

const makeUntil = op(Primitive.OpCodes.OP_UNTIL)

export function until<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  when: Fx<R2, E2, B>
): Fx<R | R2, E | E2, A> {
  return makeUntil(fx, { i0: when })
}
