import * as Chunk from "@effect/data/Chunk"
import * as Equal from "@effect/data/Equal"
import type { Equivalence } from "@effect/data/Equivalence"
import { dual, identity } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import * as Option from "@effect/data/Option"
import { pipeArguments } from "@effect/data/Pipeable"
import * as Cause from "@effect/io/Cause"
import * as Deferred from "@effect/io/Deferred"
import * as Effect from "@effect/io/Effect"
import type * as Fiber from "@effect/io/Fiber"
import type * as Layer from "@effect/io/Layer"
import type * as Schedule from "@effect/io/Schedule"
import * as Scope from "@effect/io/Scope"
import type * as Context from "@typed/context"
import { type InternalEffect, OpCodes as EffectOpCodes } from "@typed/fx/internal/effect-primitive"
import type { FlattenStrategy, Fx, Operator } from "@typed/fx/internal/fx-primitive"
import * as Primitive from "@typed/fx/internal/fx-primitive"
import * as Provide from "@typed/fx/internal/provide"
import * as Sink from "@typed/fx/internal/sink"

const Variance = {
  _R: identity,
  _E: identity,
  _A: identity
}

// TODO: AcquireUseRelease
// TODO: Ensuring ?
// TODO: Provide Layer/Context, we should be able to optimize these together in many cases
// TODO: We should explore creating a glitch-free combine operator since we'll understand the stream graph

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

export function matchPrimitive<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  primitive: FxPrimitive,
  options: {
    readonly combine: (fx: CombineImpl<any>) => A
    readonly empty: (fx: EmptyImpl) => B
    readonly failCause: (fx: FailCauseImpl<any>) => C
    readonly fromEffect: (fx: FromEffectImpl<any, any, any>) => D
    readonly fromSink: (fx: FromSinkImpl<any, any, any>) => E
    readonly merge: (fx: MergeImpl<any>) => F
    readonly never: (fx: NeverImpl) => G
    readonly operator: (fx: OperatorImpl<any, any, any>) => H
    readonly race: (fx: RaceImpl<any>) => I
    readonly scheduled: (fx: ScheduledImpl<any, any, any>) => J
    readonly succeed: (fx: SucceedImpl<any>) => K
    readonly suspend: (fx: Suspend<any, any, any>) => L
    readonly sync: (fx: SyncImpl<any>) => M
  }
): A | B | C | D | E | F | G | H | I | J | K | L | M {
  switch (primitive._tag) {
    case "Fx/Combine":
      return options.combine(primitive)
    case "Fx/Empty":
      return options.empty(primitive)
    case "Fx/FailCause":
      return options.failCause(primitive)
    case "Fx/FromEffect":
      return options.fromEffect(primitive)
    case "Fx/FromSink":
      return options.fromSink(primitive)
    case "Fx/Merge":
      return options.merge(primitive)
    case "Fx/Never":
      return options.never(primitive)
    case "Fx/Operator":
      return options.operator(primitive)
    case "Fx/Race":
      return options.race(primitive)
    case "Fx/Scheduled":
      return options.scheduled(primitive)
    case "Fx/Succeed":
      return options.succeed(primitive)
    case "Fx/Suspend":
      return options.suspend(primitive)
    case "Fx/Sync":
      return options.sync(primitive)
  }
}

export abstract class BaseFx<R, E, A> implements Fx<R, E, A> {
  abstract readonly _tag: string
  readonly [Primitive.TypeId]: Fx<R, E, A>[Primitive.TypeId] = Variance

  readonly drain: Fx<R, E, A>["drain"]

  constructor(
    readonly i0?: unknown,
    readonly i1?: unknown,
    readonly i2?: unknown
  ) {
    this.drain = drain(this as any)
    this.observe = this.observe.bind(this)
  }

  [Equal.symbol](this: {}, that: unknown) {
    return this === that
  }
  [Hash.symbol](this: {}) {
    return Hash.random(this)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }

  observe<R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Effect.Effect<R | R2, E | E2, void> {
    return observe(this as Fx<R, E, A>, f)
  }
}

export class SucceedImpl<A> extends BaseFx<never, never, A> {
  readonly _tag = "Fx/Succeed"

  constructor(
    readonly i0: A
  ) {
    super(i0)
  }
}

export class SyncImpl<A> extends BaseFx<never, never, A> {
  readonly _tag = "Fx/Sync"

  constructor(
    readonly i0: () => A
  ) {
    super(i0)
  }
}

export class Suspend<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/Suspend"

  constructor(
    readonly i0: () => Fx<R, E, A>
  ) {
    super(i0)
  }
}

export class FailCauseImpl<E> extends BaseFx<never, E, never> {
  readonly _tag = "Fx/FailCause"

  constructor(
    readonly i0: Cause.Cause<E>
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
    readonly i0: (sink: Sink.Sink<E, A>) => Effect.Effect<R, never, unknown>
  ) {
    super(i0)
  }
}

export class FromEffectImpl<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/FromEffect"

  constructor(
    readonly i0: Effect.Effect<R, E, A>
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
    readonly i0: FX
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
    readonly i0: FX,
    readonly i1: Primitive.MergeStrategy
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
    readonly i0: FX
  ) {
    super(i0)
  }
}

export class ScheduledImpl<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/Scheduled"

  constructor(
    i0: Effect.Effect<any, any, any>,
    i1: Schedule.Schedule<any, any, any>
  ) {
    super(i0, i1)
  }
}

export interface OperatorOptions {
  readonly operators: Chunk.Chunk<Operator>
  readonly startWith: Chunk.Chunk<any>
  readonly endWith: Chunk.Chunk<any>
  readonly provide: Provide.Provide<any, any, any> | undefined
}

const emptyChunk = Chunk.empty()

export function OperatorOptions(
  options: Partial<OperatorOptions>
): OperatorOptions {
  return {
    operators: options.operators || emptyChunk,
    startWith: options.startWith || emptyChunk,
    endWith: options.endWith || emptyChunk,
    provide: options.provide
  }
}

function matchOperatorImpl<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  onOperator: (fx: OperatorImpl<R, E, A>) => B,
  onOther: (fx: Fx<R, E, A>) => C
): B | C {
  if (fx instanceof OperatorImpl) {
    return onOperator(fx)
  } else {
    return onOther(fx)
  }
}

export class OperatorImpl<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/Operator"

  constructor(
    readonly i0: Fx<any, any, any>,
    readonly i1: OperatorOptions
  ) {
    super(i0, i1)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }

  static make<R, E, A>(
    source: Fx<any, any, any>,
    newOperator: Operator
  ): OperatorImpl<R, E, A> {
    return matchOperatorImpl(fromInput(source), (fx) => {
      const { operators } = fx.i1
      const lastIndex = Chunk.size(operators) - 1

      if (lastIndex === -1) {
        return new OperatorImpl(
          fx,
          OperatorOptions({
            ...fx.i1,
            operators: Chunk.append(operators, newOperator)
          })
        )
      } else {
        const last = Chunk.unsafeGet(operators, lastIndex)
        const decision = operatorFusion(last, newOperator)

        switch (decision._tag) {
          // Append the new operator to the end
          case "Append":
            return new OperatorImpl(
              fx,
              OperatorOptions({
                ...fx.i1,
                operators: Chunk.append(operators, decision.operator)
              })
            )
          // Replace the last operator with the new operator
          case "Replace":
            return new OperatorImpl(
              fx.i0,
              OperatorOptions({
                ...fx.i1,
                operators: Chunk.replace(
                  operators,
                  lastIndex,
                  decision.operator
                )
              })
            )
          // Place the new operator before the last operator
          case "Commute": {
            return new OperatorImpl(
              fx,
              OperatorOptions({
                ...fx.i1,
                operators: Chunk.append(
                  Chunk.replace(operators, lastIndex, decision.operator),
                  last
                )
              })
            )
          }
          case "NewOperator":
            return new OperatorImpl(
              fx,
              OperatorOptions({
                operators: Chunk.of(newOperator)
              })
            )
        }
      }
    }, () =>
      new OperatorImpl(
        source,
        OperatorOptions({
          operators: Chunk.of(newOperator)
        })
      ))
  }

  static startWith<R, E, A>(
    fx: Fx<any, any, any>,
    startWith: A
  ): Fx<R, E, A> {
    return matchOperatorImpl(fx, (operator) =>
      new OperatorImpl(
        fx,
        OperatorOptions({
          ...operator.i1,
          startWith: Chunk.prepend(operator.i1.startWith, startWith)
        })
      ), () =>
      new OperatorImpl(
        fx,
        OperatorOptions({
          startWith: Chunk.of(startWith)
        })
      ))
  }

  static endWith<R, E, A>(
    fx: Fx<any, any, any>,
    endWith: A
  ): Fx<R, E, A> {
    return matchOperatorImpl(fx, (operator) =>
      new OperatorImpl(
        fx,
        OperatorOptions({
          ...operator.i1,
          endWith: Chunk.append(operator.i1.endWith, endWith)
        })
      ), () =>
      new OperatorImpl(
        fx,
        OperatorOptions({
          endWith: Chunk.of(endWith)
        })
      ))
  }

  static provide<R, E, A, R2>(
    fx: Fx<R, E, A>,
    context: Context.Context<R2>
  ): Fx<Exclude<R, R2>, E, A> {
    return matchOperatorImpl(fx, (fx) =>
      new OperatorImpl(
        fx.i0,
        OperatorOptions({
          ...fx.i1,
          provide: fx.i1.provide
            ? Provide.merge(fx.i1.provide, Provide.ProvideContext(context))
            : Provide.ProvideContext(context)
        })
      ), () =>
      new OperatorImpl(
        fx,
        OperatorOptions({
          provide: Provide.ProvideContext(context)
        })
      ))
  }

  static provideLayer<R, E, A, R2, E2, S>(
    fx: Fx<R, E, A>,
    layer: Layer.Layer<R2, E2, S>
  ): Fx<Exclude<R, S> | R2, E | E2, A> {
    return matchOperatorImpl(fx, (fx) =>
      new OperatorImpl(
        fx.i0,
        OperatorOptions({
          ...fx.i1,
          provide: fx.i1.provide
            ? Provide.merge(fx.i1.provide, Provide.ProvideLayer(layer))
            : Provide.ProvideLayer(layer)
        })
      ), () =>
      new OperatorImpl(
        fx,
        OperatorOptions({
          provide: Provide.ProvideLayer(layer)
        })
      ))
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

const notImplemented = Effect.fail("Not Implemented" as never)

export type ScopedFork = <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber.Runtime<E, A>>

export function withScopedFork<R, E, A>(
  f: (fork: ScopedFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
): Effect.Effect<R, E, A> {
  return Effect.acquireUseRelease(
    Scope.make(),
    (scope) => f((effect) => Effect.forkIn(Effect.interruptible(effect), scope), scope),
    Scope.close
  )
}

export function observe<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2, E | E2, void> {
  return withScopedFork((fork) =>
    Deferred.make<E | E2, void>().pipe(
      Effect.flatMap((deferred) =>
        run(
          fromInput(fx),
          Sink.WithContext(
            (cause) => Deferred.failCause(deferred, cause),
            (a) => Effect.catchAllCause(f(a), (cause) => Deferred.failCause(deferred, cause))
          )
        ).pipe(
          Effect.flatMap(() => Deferred.succeed(deferred, undefined)),
          fork,
          Effect.flatMap(() => Deferred.await(deferred))
        )
      )
    )
  )
}

export function drain<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, void> {
  return observe(fx, () => Effect.unit)
}

export function toArray<R, E, A>(
  fx: Fx<R, E, A>
): Effect.Effect<R, E, Array<A>> {
  return Effect.suspend(() => {
    const array: Array<A> = []

    return Effect.as(
      observe(fx, (a) => Effect.sync(() => array.push(a))),
      array
    )
  })
}

export function toReadonlyArray<R, E, A>(
  fx: Fx<R, E, A>
): Effect.Effect<R, E, ReadonlyArray<A>> {
  return toArray(fx)
}

export function run<R, E, A, R2>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, unknown> {
  return matchPrimitive(fx as FxPrimitive, {
    combine: () => notImplemented,
    empty: () => Effect.unit,
    failCause: (fx) => Effect.failCause(fx.i0),
    fromEffect: (fx) => Effect.matchCauseEffect(fx.i0, sink),
    fromSink: () => notImplemented,
    merge: () => notImplemented,
    never: () => Effect.never,
    operator: (fx) => runOperator(fx, sink),
    race: () => notImplemented,
    scheduled: () => notImplemented,
    succeed: (fx) => sink.onSuccess(fx.i0),
    suspend: (fx) => run(fx.i0(), sink),
    sync: (fx) => Effect.suspend(() => sink.onSuccess(fx.i0()))
  })
}

function runOperator<R, E, A, R2>(
  fx: OperatorImpl<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, void> {
  const source = fx.i0
  const { endWith, operators, provide, startWith } = fx.i1
  let operatorSink: Sink.WithContext<any, any, any> = sink

  for (const operator of Chunk.reverse(operators)) {
    operatorSink = makeOperatorSink(operator, operatorSink)
  }

  const effect = Effect.asyncEffect<never, E, void, R2, never, void>((resume) =>
    Effect.forEach(startWith, sink.onSuccess).pipe(
      Effect.flatMap(() => run(source, operatorSink)),
      Effect.flatMap(() => Effect.forEach(Chunk.reverse(endWith), sink.onSuccess)),
      Effect.matchCauseEffect({
        onFailure: (cause) => Effect.sync(() => resume(Effect.failCause(cause as Cause.Cause<E>))),
        onSuccess: () => Effect.sync(() => resume(Effect.unit))
      })
    )
  )

  if (provide) {
    return Provide.provideToEffect(effect, provide)
  }

  return effect
}

function makeOperatorSink(operator: Operator, sink: Sink.WithContext<any, any, any>): Sink.WithContext<any, any, any> {
  return Primitive.matchOperator(operator, {
    "Fx/ContinueWith": () => sink,
    "Fx/DropAfter": () => sink,
    "Fx/DropUntil": () => sink,
    "Fx/DropWhile": () => sink,
    "Fx/During": () => sink,
    "Fx/Filter": () => sink,
    "Fx/FilterEffect": () => sink,
    "Fx/FilterMap": () => sink,
    "Fx/FilterMapEffect": () => sink,
    "Fx/FlatMap": () => sink,
    "Fx/FlatMapCause": () => sink,
    "Fx/Hold": () => sink,
    "Fx/Loop": () => sink,
    "Fx/LoopEffect": () => sink,
    "Fx/Map": (map) =>
      Sink.WithContext(
        sink.onFailure,
        (a) => sink.onSuccess(map.i0(a))
      ),
    "Fx/MapEffect": (mapEffect) =>
      Sink.WithContext(
        sink.onFailure,
        (a) => Effect.matchCauseEffect(mapEffect.i0(a), sink)
      ),
    "Fx/MatchCause": () => sink,
    "Fx/Multicast": () => sink,
    "Fx/OrElse": () => sink,
    "Fx/Since": () => sink,
    "Fx/SkipRepeats": () => sink,
    "Fx/Slice": () => sink,
    "Fx/Snapshot": () => sink,
    "Fx/TakeUntil": () => sink,
    "Fx/TakeWhile": () => sink,
    "Fx/Tap": () => sink,
    "Fx/TapEffect": () => sink,
    "Fx/Until": () => sink
  })
}

export type FxInput<R, E, A> = Fx<R, E, A> | Effect.Effect<R, E, A> | Cause.Cause<E> | ReadonlyArray<A>

export function fromInput<const A extends ReadonlyArray<any>>(input: A): Fx<never, never, A[number]>
export function fromInput<E>(input: Cause.Cause<E>): Fx<never, E, never>
export function fromInput<R = never, E = never, A = never>(input: FxInput<R, E, A>): Fx<R, E, A>

export function fromInput<R = never, E = never, A = never>(input: FxInput<R, E, A>): Fx<R, E, A> {
  if (Primitive.TypeId in input) {
    return input as Fx<R, E, A>
  } else if ((Array.isArray as (i: typeof input) => i is ReadonlyArray<A>)(input)) {
    return merge(input.map((x) => new SucceedImpl(x)))
  } else {
    switch ((input as Cause.Cause<E> | InternalEffect)._tag) {
      // Cause
      case "Fail":
      case "Annotated":
      case "Die":
      case "Empty":
      case "Interrupt":
      case "Sequential":
      case "Parallel":
        return new FailCauseImpl(input)
      default:
        return fromEffect(input as Effect.Effect<R, E, A>)
    }
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

const makeOperator = <T extends Primitive.OpCodes>(tag: T) =>
(
  body: Omit<Extract<Operator, { readonly _tag: T }>, "_tag">
): Operator => ({ ...body, _tag: tag }) as Operator

const makeMap = makeOperator(Primitive.OpCodes.OP_MAP)

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = dual(2, function map<R, E, A, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => B
): Fx<R, E, B> {
  return OperatorImpl.make(fx, makeMap({ i0: f }))
})

const makeMapEffect = makeOperator(Primitive.OpCodes.OP_MAP_EFFECT)

export function mapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx<R | R2, E | E2, B> {
  return OperatorImpl.make(fx, makeMapEffect({ i0: f }))
}

const makeFlatMap = makeOperator(Primitive.OpCodes.OP_FLAT_MAP)

export function flatMapWithStrategy<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  strategy: FlattenStrategy
): Fx<R | R2, E | E2, B> {
  return OperatorImpl.make(fx, makeFlatMap({ i0: f, i1: strategy }))
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

const makeFlatMapCause = makeOperator(Primitive.OpCodes.OP_FLAT_MAP_CAUSE)

export function flatMapCauseWithStrategy<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => Fx<R2, E2, B>,
  strategy: FlattenStrategy
): Fx<R | R2, E2, B> {
  return OperatorImpl.make(fx, makeFlatMapCause({ i0: f, i1: strategy }))
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

const makeContinueWith = makeOperator(Primitive.OpCodes.OP_CONTINUE_WITH)

export function continueWith<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: () => Fx<R2, E2, B>
): Fx<R | R2, E | E2, A | B> {
  return OperatorImpl.make(fx, makeContinueWith({ i0: f }))
}

const makeDropAfter = makeOperator(Primitive.OpCodes.OP_DROP_AFTER)

export function dropAfter<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeDropAfter({ i0: f }))
}

const makeDropUntil = makeOperator(Primitive.OpCodes.OP_DROP_UNTIL)

export function dropUntil<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeDropUntil({ i0: f }))
}

const makeDropWhile = makeOperator(Primitive.OpCodes.OP_DROP_WHILE)

export function dropWhile<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeDropWhile({ i0: f }))
}

const makeDuring = makeOperator(Primitive.OpCodes.OP_DURING)

export function during<R, E, A, R2, E2, R3, E3, B>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, Fx<R3, E3, B>>
): Fx<R | R2 | R3, E | E2 | E3, A> {
  return OperatorImpl.make(fx, makeDuring({ i0: window }))
}

const makeFilter = makeOperator(Primitive.OpCodes.OP_FILTER)

export function filter<R, E, A>(
  fx: Fx<R, E, A>,
  f: (a: A) => boolean
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeFilter({ i0: f }))
}

const makeFilterEffect = makeOperator(Primitive.OpCodes.OP_FILTER_EFFECT)

export function filterEffect<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E | E2, A> {
  return OperatorImpl.make(fx, makeFilterEffect({ i0: f }))
}

const makeFilterMap = makeOperator(Primitive.OpCodes.OP_FILTER_MAP)

export function filterMap<R, E, A, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Option.Option<B>
): Fx<R, E, B> {
  return OperatorImpl.make(fx, makeFilterMap({ i0: f }))
}

const makeFilterMapEffect = makeOperator(Primitive.OpCodes.OP_FILTER_MAP_EFFECT)

export function filterMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Fx<R | R2, E | E2, B> {
  return OperatorImpl.make(fx, makeFilterMapEffect({ i0: f }))
}

const makeHold = makeOperator(Primitive.OpCodes.OP_HOLD)

export function hold<R, E, A>(
  fx: Fx<R, E, A>
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeHold({}))
}

const makeLoop = makeOperator(Primitive.OpCodes.OP_LOOP)

export function loop<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  f: (b: B, a: A) => readonly [C, B],
  b: B
): Fx<R, E, C> {
  return OperatorImpl.make(fx, makeLoop({ i0: f, i1: b }))
}

const makeLoopEffect = makeOperator(Primitive.OpCodes.OP_LOOP_EFFECT)

export function loopEffect<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  f: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>,
  b: B
): Fx<R | R2, E | E2, C> {
  return OperatorImpl.make(fx, makeLoopEffect({ i0: f, i1: b }))
}

const makeMatchCause = makeOperator(Primitive.OpCodes.OP_MATCH_CAUSE)

export function matchCauseWithStrategy<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
  strategy: FlattenStrategy
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return OperatorImpl.make(fx, makeMatchCause({ i0: f, i1: g, i2: strategy }))
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

const makeMulticast = makeOperator(Primitive.OpCodes.OP_MULTICAST)

export function multicast<R, E, A>(
  fx: Fx<R, E, A>
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeMulticast({}))
}

const makeOrElse = makeOperator(Primitive.OpCodes.OP_OR_ELSE)

export function orElse<R, E, A, R2, E2, A2>(
  fx: Fx<R, E, A>,
  f: () => Fx<R2, E2, A2>
): Fx<R | R2, E | E2, A | A2> {
  return OperatorImpl.make(fx, makeOrElse({ i0: f }))
}

const makeSince = makeOperator(Primitive.OpCodes.OP_SINCE)

export function since<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  when: Fx<R2, E2, B>
): Fx<R | R2, E | E2, A> {
  return OperatorImpl.make(fx, makeSince({ i0: when }))
}

const makeSkipRepeats = makeOperator(Primitive.OpCodes.OP_SKIP_REPEATS)

export function skipRepeats<R, E, A>(
  fx: Fx<R, E, A>,
  eq: Equivalence<A>
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeSkipRepeats({ i0: eq }))
}

const makeTakeUntil = makeOperator(Primitive.OpCodes.OP_TAKE_UNTIL)

export function takeUntil<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeTakeUntil({ i0: f }))
}

const makeTakeWhile = makeOperator(Primitive.OpCodes.OP_TAKE_WHILE)

export function takeWhile<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeTakeWhile({ i0: f }))
}

const makeSlice = makeOperator(Primitive.OpCodes.OP_SLICE)

export function slice<R, E, A>(
  fx: Fx<R, E, A>,
  start: number,
  end: number
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeSlice({ i0: start, i1: end }))
}

const makeSnapshot = makeOperator(Primitive.OpCodes.OP_SNAPSHOT)

export function snapshot<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  sampled: Effect.Effect<R2, E2, B>,
  f: (a: A, b: B) => Effect.Effect<R3, E3, C>
): Fx<R | R2 | R3, E | E2 | E3, C> {
  return OperatorImpl.make(fx, makeSnapshot({ i0: sampled, i1: f }))
}

const makeTap = makeOperator(Primitive.OpCodes.OP_TAP)

export function tap<R, E, A, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => B
): Fx<R, E, A> {
  return OperatorImpl.make(fx, makeTap({ i0: f }))
}

const makeTapEffect = makeOperator(Primitive.OpCodes.OP_TAP_EFFECT)

export function tapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx<R | R2, E | E2, A> {
  return OperatorImpl.make(fx, makeTapEffect({ i0: f }))
}

const makeUntil = makeOperator(Primitive.OpCodes.OP_UNTIL)

export function until<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  when: Fx<R2, E2, B>
): Fx<R | R2, E | E2, A> {
  return OperatorImpl.make(fx, makeUntil({ i0: when }))
}

export function provideContext<R, E, A>(
  fx: Fx<R, E, A>,
  context: Context.Context<R>
): Fx<never, E, A> {
  return OperatorImpl.provide(fx, context)
}

export function provideLayer<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, R>
): Fx<R2, E | E2, A> {
  return OperatorImpl.provideLayer(fx, layer)
}

export function provideSomeContext<R, E, A, R2>(
  fx: Fx<R, E, A>,
  context: Context.Context<R2>
): Fx<Exclude<R, R2>, E, A> {
  return OperatorImpl.provide(fx, context)
}

export function provideSomeLayer<R, E, A, R2, E2, S>(
  fx: Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, S>
): Fx<Exclude<R, S> | R2, E | E2, A> {
  return OperatorImpl.provideLayer(fx, layer)
}

// Fusion

type FusionDecision = Append | Replace | Commute | NewOperator

type Append = {
  readonly _tag: "Append"
  readonly operator: Operator
}

function Append(operator: Operator): FusionDecision {
  return {
    _tag: "Append",
    operator
  }
}

type Replace = {
  readonly _tag: "Replace"
  readonly operator: Operator
}

function Replace(operator: Operator): FusionDecision {
  return {
    _tag: "Replace",
    operator
  }
}

type Commute = {
  readonly _tag: "Commute"
  readonly operator: Operator
}

function Commute(operator: Operator): FusionDecision {
  return {
    _tag: "Commute",
    operator
  }
}

type NewOperator = {
  readonly _tag: "NewOperator"
  readonly operator: Operator
}

type OperatorFusionMap = {
  [K in Primitive.OpCodes]?: {
    [K2 in Primitive.OpCodes]?: (
      last: Extract<Operator, { readonly _tag: K }>,
      next: Extract<Operator, { readonly _tag: K2 }>
    ) => FusionDecision
  }
}

const operatorFusionMap: OperatorFusionMap = {
  [Primitive.OpCodes.OP_MAP]: {
    [Primitive.OpCodes.OP_MAP]: mapFusion
  },
  [Primitive.OpCodes.OP_FILTER]: {
    [Primitive.OpCodes.OP_FILTER]: filterFusion,
    [Primitive.OpCodes.OP_MAP]: filterToMapFusion
  }
}

function mapFusion(last: Primitive.Map, next: Primitive.Map): FusionDecision {
  return Replace(makeMap({
    i0: (a: any) => next.i0(last.i0(a))
  }))
}

function filterFusion(last: Primitive.Filter, next: Primitive.Filter): FusionDecision {
  return Replace(makeFilter({
    i0: (a: any) => last.i0(a) && next.i0(a)
  }))
}

function filterToMapFusion(last: Primitive.Filter, next: Primitive.Map): FusionDecision {
  return Replace(makeFilterMap({
    i0: (a: any) => last.i0(a) ? Option.some(next.i0(a)) : Option.none()
  }))
}

function operatorFusion(last: Operator, next: Operator): FusionDecision {
  const fusionMap = operatorFusionMap[last._tag]

  if (fusionMap === undefined) return Append(next)

  const fusion = fusionMap[next._tag]

  if (fusion === undefined) return Append(next)

  return fusion(last as any, next as any)
}

export function registerOperatorFusion<A extends Primitive.OpCodes, B extends Primitive.OpCodes>(
  a: A,
  b: B,
  fusion: (
    last: Extract<Operator, { readonly _tag: A }>,
    next: Extract<Operator, { readonly _tag: B }>
  ) => FusionDecision
): void {
  if (!operatorFusionMap[a]) {
    ;(operatorFusionMap as any)[a] = {}
  }

  ;(operatorFusionMap[a] as any)[b] = fusion
}
