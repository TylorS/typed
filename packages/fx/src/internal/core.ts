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
import type * as fxPrimitive from "@typed/fx/internal/fx-primitive"
import * as Primitive from "@typed/fx/internal/fx-primitive"
import * as Provide from "@typed/fx/internal/provide"
import * as Sink from "@typed/fx/internal/sink"

const Variance = {
  _R: identity,
  _E: identity,
  _A: identity
}

// TODO: AcquireUseRelease
// TODO: Ensuring
// TODO: Provide Layer/Context, we should be able to optimize these together in many cases
// TODO: We should explore creating a glitch-free combine operator since we'll understand the stream graph
// Transformers + Filtering + Looping
// Flattening
// Slicing
// Time slicing
// Sharing
// StartWith + EndWith
// Tap/Side effects
// Apply Effect transformations to an Fx

export type FxPrimitive =
  | Combine<any>
  | Empty
  | FailCause<any>
  | FromEffect<any, any, any>
  | FromSink<any, any, any>
  | Merge<any>
  | Never
  | Operator<any, any, any>
  | Race<any>
  | Scheduled<any, any, any>
  | Succeed<any>
  | Suspend<any, any, any>
  | Sync<any>

export function matchPrimitive<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  primitive: FxPrimitive,
  options: {
    readonly combine: (fx: Combine<any>) => A
    readonly empty: (fx: Empty) => B
    readonly failCause: (fx: FailCause<any>) => C
    readonly fromEffect: (fx: FromEffect<any, any, any>) => D
    readonly fromSink: (fx: FromSink<any, any, any>) => E
    readonly merge: (fx: Merge<any>) => F
    readonly never: (fx: Never) => G
    readonly operator: (fx: Operator<any, any, any>) => H
    readonly race: (fx: Race<any>) => I
    readonly scheduled: (fx: Scheduled<any, any, any>) => J
    readonly succeed: (fx: Succeed<any>) => K
    readonly suspend: (fx: Suspend<any, any, any>) => L
    readonly sync: (fx: Sync<any>) => M
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

export abstract class BaseFx<R, E, A> implements fxPrimitive.Fx<R, E, A> {
  abstract readonly _tag: string
  readonly [Primitive.TypeId]: fxPrimitive.Fx<R, E, A>[Primitive.TypeId] = Variance

  readonly drain: fxPrimitive.Fx<R, E, A>["drain"]

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
    return observe(this as fxPrimitive.Fx<R, E, A>, f)
  }
}

export class Succeed<A> extends BaseFx<never, never, A> {
  readonly _tag = "Fx/Succeed"

  constructor(
    readonly i0: A
  ) {
    super(i0)
  }
}

export class Sync<A> extends BaseFx<never, never, A> {
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
    readonly i0: () => fxPrimitive.Fx<R, E, A>
  ) {
    super(i0)
  }
}

export class FailCause<E> extends BaseFx<never, E, never> {
  readonly _tag = "Fx/FailCause"

  constructor(
    readonly i0: Cause.Cause<E>
  ) {
    super(i0)
  }
}

export class Empty extends BaseFx<never, never, never> {
  readonly _tag = "Fx/Empty"
}

export class Never extends BaseFx<never, never, never> {
  readonly _tag = "Fx/Never"
}

export class FromSink<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/FromSink"

  constructor(
    readonly i0: (sink: Sink.Sink<E, A>) => Effect.Effect<R, never, unknown>
  ) {
    super(i0)
  }
}

export class FromEffect<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/FromEffect"

  constructor(
    readonly i0: Effect.Effect<R, E, A>
  ) {
    super(i0)
  }
}

export class Combine<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>> extends BaseFx<
  fxPrimitive.Fx.Context<FX[number]>,
  fxPrimitive.Fx.Error<FX[number]>,
  { readonly [K in keyof FX]: fxPrimitive.Fx.Success<FX[K]> }
> {
  readonly _tag = "Fx/Combine"

  constructor(
    readonly i0: FX
  ) {
    super(i0)
  }

  static make<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
    fxs: FX
  ): fxPrimitive.Fx<
    fxPrimitive.Fx.Context<FX[number]>,
    fxPrimitive.Fx.Error<FX[number]>,
    { readonly [K in keyof FX]: fxPrimitive.Fx.Success<FX[K]> }
  > {
    // TODO: Convert empty/never to empty/never
    return new Combine(fxs)
  }
}

export class Merge<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>> extends BaseFx<
  fxPrimitive.Fx.Context<FX[number]>,
  fxPrimitive.Fx.Error<FX[number]>,
  fxPrimitive.Fx.Success<FX[number]>
> {
  readonly _tag = "Fx/Merge"

  constructor(
    readonly i0: FX,
    readonly i1: Primitive.MergeStrategy
  ) {
    super(i0, i1)
  }

  static make<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
    fxs: FX,
    strategy: Primitive.MergeStrategy
  ): fxPrimitive.Fx<
    fxPrimitive.Fx.Context<FX[number]>,
    fxPrimitive.Fx.Error<FX[number]>,
    fxPrimitive.Fx.Success<FX[number]>
  > {
    // TODO: Filter out empty/never Fx

    return new Merge(fxs, strategy)
  }
}

export class Race<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>> extends BaseFx<
  fxPrimitive.Fx.Context<FX[number]>,
  fxPrimitive.Fx.Error<FX[number]>,
  fxPrimitive.Fx.Success<FX[number]>
> {
  readonly _tag = "Fx/Race"

  constructor(
    readonly i0: FX
  ) {
    super(i0)
  }
}

export class Scheduled<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/Scheduled"

  constructor(
    i0: Effect.Effect<any, any, any>,
    i1: Schedule.Schedule<any, any, any>
  ) {
    super(i0, i1)
  }
}

export interface OperatorOptions {
  readonly operators: Chunk.Chunk<fxPrimitive.Operator>
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

function matchOperator<R, E, A, B, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  onOperator: (fx: Operator<R, E, A>) => B,
  onOther: (fx: fxPrimitive.Fx<R, E, A>) => C
): B | C {
  if (fx instanceof Operator) {
    return onOperator(fx)
  } else {
    return onOther(fx)
  }
}

export class Operator<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = "Fx/Operator"

  constructor(
    readonly i0: fxPrimitive.Fx<any, any, any>,
    readonly i1: OperatorOptions
  ) {
    super(i0, i1)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }

  static make<R, E, A>(
    source: fxPrimitive.Fx<any, any, any>,
    newOperator: fxPrimitive.Operator
  ): Operator<R, E, A> {
    return matchOperator(fromInput(source), (fx) => {
      const { operators } = fx.i1
      const lastIndex = Chunk.size(operators) - 1

      if (lastIndex === -1) {
        return new Operator(
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
            return new Operator(
              fx,
              OperatorOptions({
                ...fx.i1,
                operators: Chunk.append(operators, decision.operator)
              })
            )
          // Replace the last operator with the new operator
          case "Replace":
            return new Operator(
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
            return new Operator(
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
          // Construct a new Operator
          case "NewOperator":
            return new Operator(
              fx,
              OperatorOptions({
                operators: Chunk.of(newOperator)
              })
            )
        }
      }
    }, () =>
      new Operator(
        source,
        OperatorOptions({
          operators: Chunk.of(newOperator)
        })
      ))
  }

  static startWith<R, E, A>(
    fx: fxPrimitive.Fx<any, any, any>,
    startWith: A
  ): fxPrimitive.Fx<R, E, A> {
    return matchOperator(fx, (operator) =>
      new Operator(
        fx,
        OperatorOptions({
          ...operator.i1,
          startWith: Chunk.prepend(operator.i1.startWith, startWith)
        })
      ), () =>
      new Operator(
        fx,
        OperatorOptions({
          startWith: Chunk.of(startWith)
        })
      ))
  }

  static endWith<R, E, A>(
    fx: fxPrimitive.Fx<any, any, any>,
    endWith: A
  ): fxPrimitive.Fx<R, E, A> {
    return matchOperator(fx, (operator) =>
      new Operator(
        fx,
        OperatorOptions({
          ...operator.i1,
          endWith: Chunk.append(operator.i1.endWith, endWith)
        })
      ), () =>
      new Operator(
        fx,
        OperatorOptions({
          endWith: Chunk.of(endWith)
        })
      ))
  }

  static provide<R, E, A, R2>(
    fx: fxPrimitive.Fx<R, E, A>,
    context: Context.Context<R2>
  ): fxPrimitive.Fx<Exclude<R, R2>, E, A> {
    return matchOperator(fx, (fx) =>
      new Operator(
        fx.i0,
        OperatorOptions({
          ...fx.i1,
          provide: fx.i1.provide
            ? Provide.merge(fx.i1.provide, Provide.ProvideContext(context))
            : Provide.ProvideContext(context)
        })
      ), () =>
      new Operator(
        fx,
        OperatorOptions({
          provide: Provide.ProvideContext(context)
        })
      ))
  }

  static provideLayer<R, E, A, R2, E2, S>(
    fx: fxPrimitive.Fx<R, E, A>,
    layer: Layer.Layer<R2, E2, S>
  ): fxPrimitive.Fx<Exclude<R, S> | R2, E | E2, A> {
    return matchOperator(fx, (fx) =>
      new Operator(
        fx.i0,
        OperatorOptions({
          ...fx.i1,
          provide: fx.i1.provide
            ? Provide.merge(fx.i1.provide, Provide.ProvideLayer(layer))
            : Provide.ProvideLayer(layer)
        })
      ), () =>
      new Operator(
        fx,
        OperatorOptions({
          provide: Provide.ProvideLayer(layer)
        })
      ))
  }
}

export function succeed<A>(value: A): fxPrimitive.Fx<never, never, A> {
  return new Succeed(value)
}

export function fail<E>(error: E): fxPrimitive.Fx<never, E, never> {
  return new FailCause(Cause.fail(error))
}

export function failCause<E>(cause: Cause.Cause<E>): fxPrimitive.Fx<never, E, never> {
  return new FailCause(cause)
}

export function combine<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
  fxs: FX
): fxPrimitive.Fx<
  fxPrimitive.Fx.Context<FX[number]>,
  fxPrimitive.Fx.Error<FX[number]>,
  { readonly [K in keyof FX]: fxPrimitive.Fx.Success<FX[K]> }
> {
  return new Combine(fxs)
}

export function mergeWithStrategy<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
  fxs: FX,
  strategy: Primitive.MergeStrategy
): fxPrimitive.Fx<
  fxPrimitive.Fx.Context<FX[number]>,
  fxPrimitive.Fx.Error<FX[number]>,
  fxPrimitive.Fx.Success<FX[number]>
> {
  return new Merge(fxs, strategy)
}

export function merge<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
  fxs: FX
): fxPrimitive.Fx<
  fxPrimitive.Fx.Context<FX[number]>,
  fxPrimitive.Fx.Error<FX[number]>,
  fxPrimitive.Fx.Success<FX[number]>
> {
  return mergeWithStrategy(fxs, Primitive.Unordered(Infinity))
}

export function mergeConcurrently<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
  fxs: FX,
  concurrency: number
): fxPrimitive.Fx<
  fxPrimitive.Fx.Context<FX[number]>,
  fxPrimitive.Fx.Error<FX[number]>,
  fxPrimitive.Fx.Success<FX[number]>
> {
  return mergeWithStrategy(fxs, Primitive.Unordered(concurrency))
}

export function mergeBufferConcurrently<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
  fxs: FX,
  concurrency: number
) {
  return mergeWithStrategy(fxs, Primitive.Ordered(concurrency))
}

export function mergeBuffer<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
  fxs: FX
) {
  return mergeWithStrategy(fxs, Primitive.Ordered(Infinity))
}

export function switchBuffer<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
  fxs: FX
) {
  return mergeWithStrategy(fxs, Primitive.Switch)
}

export function race<FX extends ReadonlyArray<fxPrimitive.Fx<any, any, any>>>(
  fxs: FX
): fxPrimitive.Fx<
  fxPrimitive.Fx.Context<FX[number]>,
  fxPrimitive.Fx.Error<FX[number]>,
  fxPrimitive.Fx.Success<FX[number]>
> {
  return new Race(fxs)
}

const notemented = Effect.fail("Not emented" as never)

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
  fx: fxPrimitive.Fx<R, E, A>,
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

export function drain<R, E, A>(fx: fxPrimitive.Fx<R, E, A>): Effect.Effect<R, E, void> {
  return observe(fx, () => Effect.unit)
}

export function toArray<R, E, A>(
  fx: fxPrimitive.Fx<R, E, A>
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
  fx: fxPrimitive.Fx<R, E, A>
): Effect.Effect<R, E, ReadonlyArray<A>> {
  return toArray(fx)
}

export function run<R, E, A, R2>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fx: fxPrimitive.Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, unknown> {
  return matchPrimitive(fx as FxPrimitive, {
    combine: () => notemented,
    empty: () => Effect.unit,
    failCause: (fx) => Effect.failCause(fx.i0),
    fromEffect: (fx) => Effect.matchCauseEffect(fx.i0, sink),
    fromSink: () => notemented,
    merge: () => notemented,
    never: () => Effect.never,
    operator: (fx) => runOperator(fx, sink),
    race: () => notemented,
    scheduled: () => notemented,
    succeed: (fx) => sink.onSuccess(fx.i0),
    suspend: (fx) => run(fx.i0(), sink),
    sync: (fx) => Effect.suspend(() => sink.onSuccess(fx.i0()))
  })
}

function runOperator<R, E, A, R2>(
  fx: Operator<R, E, A>,
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

function makeOperatorSink(
  operator: fxPrimitive.Operator,
  sink: Sink.WithContext<any, any, any>
): Sink.WithContext<any, any, any> {
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

export type FxInput<R, E, A> = fxPrimitive.Fx<R, E, A> | Effect.Effect<R, E, A> | Cause.Cause<E> | ReadonlyArray<A>

export function fromInput<const A extends ReadonlyArray<any>>(input: A): fxPrimitive.Fx<never, never, A[number]>
export function fromInput<E>(input: Cause.Cause<E>): fxPrimitive.Fx<never, E, never>
export function fromInput<R = never, E = never, A = never>(input: FxInput<R, E, A>): fxPrimitive.Fx<R, E, A>

export function fromInput<R = never, E = never, A = never>(input: FxInput<R, E, A>): fxPrimitive.Fx<R, E, A> {
  if (Primitive.TypeId in input) {
    return input as fxPrimitive.Fx<R, E, A>
  } else if ((Array.isArray as (i: typeof input) => i is ReadonlyArray<A>)(input)) {
    return merge(input.map((x) => new Succeed(x)))
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
        return new FailCause(input)
      default:
        return fromEffect(input as Effect.Effect<R, E, A>)
    }
  }
}

export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): fxPrimitive.Fx<R, E, A> {
  const i = effect as InternalEffect

  switch (i._tag) {
    // Effects that transfer directly to Fx
    case EffectOpCodes.OP_SUCCESS:
      return new Succeed(i.i0 as A)
    case EffectOpCodes.OP_SYNC:
      return new Sync(i.i0 as () => A)
    case EffectOpCodes.OP_FAILURE:
      return new FailCause<E>(i.i0 as Cause.Cause<E>)
    case EffectOpCodes.OP_COMMIT:
      return fromEffect<R, E, A>(i.commit() as Effect.Effect<R, E, A>)
    // Either
    case "Left":
      return new FailCause(Cause.fail(i.left))
    case "Right":
      return new Succeed(i.right)
    // Option
    case "None":
      return new FailCause<E>(Cause.fail(Cause.NoSuchElementException() as E))
    case "Some":
      return new Succeed(i.value)
    // Fallback to FromEffect
    default:
      return new FromEffect(effect)
  }
}

export function startWith<R, E, A, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  b: B
): fxPrimitive.Fx<R, E, A | B> {
  return Operator.startWith(fx, b)
}

export function endWith<R, E, A, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  b: B
): fxPrimitive.Fx<R, E, A | B> {
  return Operator.endWith(fx, b)
}

const makeOperator = <T extends Primitive.OpCodes>(tag: T) =>
(
  body: Omit<Extract<fxPrimitive.Operator, { readonly _tag: T }>, "_tag">
): fxPrimitive.Operator => ({ ...body, _tag: tag }) as fxPrimitive.Operator

const makeMap = makeOperator(Primitive.OpCodes.OP_MAP)

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: fxPrimitive.Fx<R, E, A>) => fxPrimitive.Fx<R, E, B>
  <R, E, A, B>(fx: fxPrimitive.Fx<R, E, A>, f: (a: A) => B): fxPrimitive.Fx<R, E, B>
} = dual(2, function map<R, E, A, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => B
): fxPrimitive.Fx<R, E, B> {
  return Operator.make(fx, makeMap({ i0: f }))
})

const makeMapEffect = makeOperator(Primitive.OpCodes.OP_MAP_EFFECT)

export function mapEffect<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): fxPrimitive.Fx<R | R2, E | E2, B> {
  return Operator.make(fx, makeMapEffect({ i0: f }))
}

const makeFlatMap = makeOperator(Primitive.OpCodes.OP_FLAT_MAP)

export function flatMapWithStrategy<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => fxPrimitive.Fx<R2, E2, B>,
  strategy: fxPrimitive.FlattenStrategy
): fxPrimitive.Fx<R | R2, E | E2, B> {
  return Operator.make(fx, makeFlatMap({ i0: f, i1: strategy }))
}

export function flatMap<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.Unbounded)
}

export function flatMapConcurrently<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => fxPrimitive.Fx<R2, E2, B>,
  concurrency: number
): fxPrimitive.Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.Bounded(concurrency))
}

export function switchMap<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.Switch)
}

export function exhaustMap<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.Exhaust)
}

export function exhaustMapLatest<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E | E2, B> {
  return flatMapWithStrategy(fx, f, Primitive.ExhaustLatest)
}

const makeFlatMapCause = makeOperator(Primitive.OpCodes.OP_FLAT_MAP_CAUSE)

export function flatMapCauseWithStrategy<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>,
  strategy: fxPrimitive.FlattenStrategy
): fxPrimitive.Fx<R | R2, E2, B> {
  return Operator.make(fx, makeFlatMapCause({ i0: f, i1: strategy }))
}

export function flatMapCause<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.Unbounded)
}

export function flatMapCauseConcurrently<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>,
  concurrency: number
): fxPrimitive.Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.Bounded(concurrency))
}

export function switchMapCause<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.Switch)
}

export function exhaustMapCause<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.Exhaust)
}

export function exhaustMapCauseLatest<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E2, B> {
  return flatMapCauseWithStrategy(fx, f, Primitive.ExhaustLatest)
}

const makeContinueWith = makeOperator(Primitive.OpCodes.OP_CONTINUE_WITH)

export function continueWith<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: () => fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E | E2, A | B> {
  return Operator.make(fx, makeContinueWith({ i0: f }))
}

const makeDropAfter = makeOperator(Primitive.OpCodes.OP_DROP_AFTER)

export function dropAfter<R, E, A, R2, E2>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeDropAfter({ i0: f }))
}

const makeDropUntil = makeOperator(Primitive.OpCodes.OP_DROP_UNTIL)

export function dropUntil<R, E, A, R2, E2>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeDropUntil({ i0: f }))
}

const makeDropWhile = makeOperator(Primitive.OpCodes.OP_DROP_WHILE)

export function dropWhile<R, E, A, R2, E2>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeDropWhile({ i0: f }))
}

const makeDuring = makeOperator(Primitive.OpCodes.OP_DURING)

export function during<R, E, A, R2, E2, R3, E3, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  window: fxPrimitive.Fx<R2, E2, fxPrimitive.Fx<R3, E3, B>>
): fxPrimitive.Fx<R | R2 | R3, E | E2 | E3, A> {
  return Operator.make(fx, makeDuring({ i0: window }))
}

const makeFilter = makeOperator(Primitive.OpCodes.OP_FILTER)

export function filter<R, E, A>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => boolean
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeFilter({ i0: f }))
}

const makeFilterEffect = makeOperator(Primitive.OpCodes.OP_FILTER_EFFECT)

export function filterEffect<R, E, A, R2, E2>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): fxPrimitive.Fx<R | R2, E | E2, A> {
  return Operator.make(fx, makeFilterEffect({ i0: f }))
}

const makeFilterMap = makeOperator(Primitive.OpCodes.OP_FILTER_MAP)

export function filterMap<R, E, A, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Option.Option<B>
): fxPrimitive.Fx<R, E, B> {
  return Operator.make(fx, makeFilterMap({ i0: f }))
}

const makeFilterMapEffect = makeOperator(Primitive.OpCodes.OP_FILTER_MAP_EFFECT)

export function filterMapEffect<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): fxPrimitive.Fx<R | R2, E | E2, B> {
  return Operator.make(fx, makeFilterMapEffect({ i0: f }))
}

const makeHold = makeOperator(Primitive.OpCodes.OP_HOLD)

export function hold<R, E, A>(
  fx: fxPrimitive.Fx<R, E, A>
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeHold({}))
}

const makeLoop = makeOperator(Primitive.OpCodes.OP_LOOP)

export function loop<R, E, A, B, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (b: B, a: A) => readonly [C, B],
  b: B
): fxPrimitive.Fx<R, E, C> {
  return Operator.make(fx, makeLoop({ i0: f, i1: b }))
}

const makeLoopEffect = makeOperator(Primitive.OpCodes.OP_LOOP_EFFECT)

export function loopEffect<R, E, A, R2, E2, B, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>,
  b: B
): fxPrimitive.Fx<R | R2, E | E2, C> {
  return Operator.make(fx, makeLoopEffect({ i0: f, i1: b }))
}

const makeMatchCause = makeOperator(Primitive.OpCodes.OP_MATCH_CAUSE)

export function matchCauseWithStrategy<R, E, A, R2, E2, B, R3, E3, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>,
  g: (a: A) => fxPrimitive.Fx<R3, E3, C>,
  strategy: fxPrimitive.FlattenStrategy
): fxPrimitive.Fx<R | R2 | R3, E2 | E3, B | C> {
  return Operator.make(fx, makeMatchCause({ i0: f, i1: g, i2: strategy }))
}

export function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>,
  g: (a: A) => fxPrimitive.Fx<R3, E3, C>
): fxPrimitive.Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.Unbounded)
}

export function matchCauseConcurrently<R, E, A, R2, E2, B, R3, E3, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>,
  g: (a: A) => fxPrimitive.Fx<R3, E3, C>,
  concurrency: number
): fxPrimitive.Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.Bounded(concurrency))
}

export function matchCauseSwitch<R, E, A, R2, E2, B, R3, E3, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>,
  g: (a: A) => fxPrimitive.Fx<R3, E3, C>
): fxPrimitive.Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.Switch)
}

export function matchCauseExhaust<R, E, A, R2, E2, B, R3, E3, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>,
  g: (a: A) => fxPrimitive.Fx<R3, E3, C>
): fxPrimitive.Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.Exhaust)
}

export function matchCauseExhaustLatest<R, E, A, R2, E2, B, R3, E3, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => fxPrimitive.Fx<R2, E2, B>,
  g: (a: A) => fxPrimitive.Fx<R3, E3, C>
): fxPrimitive.Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, Primitive.ExhaustLatest)
}

const makeMulticast = makeOperator(Primitive.OpCodes.OP_MULTICAST)

export function multicast<R, E, A>(
  fx: fxPrimitive.Fx<R, E, A>
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeMulticast({}))
}

const makeOrElse = makeOperator(Primitive.OpCodes.OP_OR_ELSE)

export function orElse<R, E, A, R2, E2, A2>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: () => fxPrimitive.Fx<R2, E2, A2>
): fxPrimitive.Fx<R | R2, E | E2, A | A2> {
  return Operator.make(fx, makeOrElse({ i0: f }))
}

const makeSince = makeOperator(Primitive.OpCodes.OP_SINCE)

export function since<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  when: fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E | E2, A> {
  return Operator.make(fx, makeSince({ i0: when }))
}

const makeSkipRepeats = makeOperator(Primitive.OpCodes.OP_SKIP_REPEATS)

export function skipRepeats<R, E, A>(
  fx: fxPrimitive.Fx<R, E, A>,
  eq: Equivalence<A>
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeSkipRepeats({ i0: eq }))
}

const makeTakeUntil = makeOperator(Primitive.OpCodes.OP_TAKE_UNTIL)

export function takeUntil<R, E, A, R2, E2>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeTakeUntil({ i0: f }))
}

const makeTakeWhile = makeOperator(Primitive.OpCodes.OP_TAKE_WHILE)

export function takeWhile<R, E, A, R2, E2>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeTakeWhile({ i0: f }))
}

const makeSlice = makeOperator(Primitive.OpCodes.OP_SLICE)

export function slice<R, E, A>(
  fx: fxPrimitive.Fx<R, E, A>,
  start: number,
  end: number
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeSlice({ i0: start, i1: end }))
}

const makeSnapshot = makeOperator(Primitive.OpCodes.OP_SNAPSHOT)

export function snapshot<R, E, A, R2, E2, B, R3, E3, C>(
  fx: fxPrimitive.Fx<R, E, A>,
  sampled: Effect.Effect<R2, E2, B>,
  f: (a: A, b: B) => Effect.Effect<R3, E3, C>
): fxPrimitive.Fx<R | R2 | R3, E | E2 | E3, C> {
  return Operator.make(fx, makeSnapshot({ i0: sampled, i1: f }))
}

const makeTap = makeOperator(Primitive.OpCodes.OP_TAP)

export function tap<R, E, A, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => B
): fxPrimitive.Fx<R, E, A> {
  return Operator.make(fx, makeTap({ i0: f }))
}

const makeTapEffect = makeOperator(Primitive.OpCodes.OP_TAP_EFFECT)

export function tapEffect<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): fxPrimitive.Fx<R | R2, E | E2, A> {
  return Operator.make(fx, makeTapEffect({ i0: f }))
}

const makeUntil = makeOperator(Primitive.OpCodes.OP_UNTIL)

export function until<R, E, A, R2, E2, B>(
  fx: fxPrimitive.Fx<R, E, A>,
  when: fxPrimitive.Fx<R2, E2, B>
): fxPrimitive.Fx<R | R2, E | E2, A> {
  return Operator.make(fx, makeUntil({ i0: when }))
}

export function provideContext<R, E, A>(
  fx: fxPrimitive.Fx<R, E, A>,
  context: Context.Context<R>
): fxPrimitive.Fx<never, E, A> {
  return Operator.provide(fx, context)
}

export function provideLayer<R, E, A, R2, E2>(
  fx: fxPrimitive.Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, R>
): fxPrimitive.Fx<R2, E | E2, A> {
  return Operator.provideLayer(fx, layer)
}

export function provideSomeContext<R, E, A, R2>(
  fx: fxPrimitive.Fx<R, E, A>,
  context: Context.Context<R2>
): fxPrimitive.Fx<Exclude<R, R2>, E, A> {
  return Operator.provide(fx, context)
}

export function provideSomeLayer<R, E, A, R2, E2, S>(
  fx: fxPrimitive.Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, S>
): fxPrimitive.Fx<Exclude<R, S> | R2, E | E2, A> {
  return Operator.provideLayer(fx, layer)
}

// Fusion

type FusionDecision = Append | Replace | Commute | NewOperator

type Append = {
  readonly _tag: "Append"
  readonly operator: fxPrimitive.Operator
}

function Append(operator: fxPrimitive.Operator): FusionDecision {
  return {
    _tag: "Append",
    operator
  }
}

type Replace = {
  readonly _tag: "Replace"
  readonly operator: fxPrimitive.Operator
}

function Replace(operator: fxPrimitive.Operator): FusionDecision {
  return {
    _tag: "Replace",
    operator
  }
}

type Commute = {
  readonly _tag: "Commute"
  readonly operator: fxPrimitive.Operator
}

function Commute(operator: fxPrimitive.Operator): FusionDecision {
  return {
    _tag: "Commute",
    operator
  }
}

type NewOperator = {
  readonly _tag: "NewOperator"
  readonly operator: fxPrimitive.Operator
}

type OperatorFusionMap = {
  [K in Primitive.OpCodes]?: {
    [K2 in Primitive.OpCodes]?: (
      last: Extract<fxPrimitive.Operator, { readonly _tag: K }>,
      next: Extract<fxPrimitive.Operator, { readonly _tag: K2 }>
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

function operatorFusion(last: fxPrimitive.Operator, next: fxPrimitive.Operator): FusionDecision {
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
    last: Extract<fxPrimitive.Operator, { readonly _tag: A }>,
    next: Extract<fxPrimitive.Operator, { readonly _tag: B }>
  ) => FusionDecision
): void {
  if (!operatorFusionMap[a]) {
    ;(operatorFusionMap as any)[a] = {}
  }

  ;(operatorFusionMap[a] as any)[b] = fusion
}
