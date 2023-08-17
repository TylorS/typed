import * as Chunk from '@effect/data/Chunk'
import * as Context from '@effect/data/Context'
import { identity } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import { pipeArguments } from '@effect/data/Pipeable'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'

import { Fx, FxTypeId } from './Fx.js'
import * as Sink from './Sink.js'

const fxVariance = {
  _R: identity,
  _E: identity,
  _A: identity,
}

abstract class BaseFx<R, E, A> implements Fx<R, E, A> {
  readonly [FxTypeId] = fxVariance

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  }

  abstract _tag: string
  abstract _type: string
  abstract run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, void>
}

/* #region Producers */

export type Producer<R, E, A> =
  | Empty
  | Succeed<A>
  | FailCause<E>
  | FromEffect<R, E, A>
  | FromSync<A>
  | Suspend<R, E, A>
  | Fusion<R, E, A>
//| FromEmitter<R, E, A> ??

export const succeed = <A>(value: A): Fx<never, never, A> => new Succeed(value)

export const failCause = <E>(cause: Cause.Cause<E>): Fx<never, E, never> => new FailCause(cause)

export const fromEffect = <R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> =>
  new FromEffect(effect)

export const fromSync = <A>(f: () => A): Fx<never, never, A> => new FromSync(f)

export const suspend = <R, E, A>(f: () => Fx<R, E, A>): Fx<R, E, A> => new Suspend(f)

// TODO: Determine how to handle creating less Fibers
// succeed, failCause, suspend, fromSync
// fromEffect
// filter, map, scan, tap
// effect variants
// flatMap, switchMap, exhaustMap, exhaustMapLatest - attempt to avoid creating fibers
// skip/takeUntil, skip/takeWhile + higher-order variants
// reduce, drain, observe

export class Empty extends BaseFx<never, never, never> {
  readonly _tag = 'Empty'
  readonly _type = 'Producer'

  run() {
    return Effect.unit
  }
}

export const empty: Fx<never, never, never> = new Empty()

export class Succeed<A> extends BaseFx<never, never, A> {
  readonly _tag = 'Succeed'
  readonly _type = 'Producer'

  constructor(readonly value: A) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, never, A>): Effect.Effect<R2, never, void> {
    return sink.event(this.value)
  }
}

export class FailCause<E> extends BaseFx<never, E, never> {
  readonly _tag = 'FailCause'
  readonly _type = 'Producer'

  constructor(readonly cause: Cause.Cause<E>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, never>): Effect.Effect<R2, never, void> {
    return sink.error(this.cause)
  }
}

export class FromEffect<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = 'FromEffect'
  readonly _type = 'Producer'

  constructor(readonly effect: Effect.Effect<R, E, A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, void> {
    return Effect.matchCauseEffect(this.effect, {
      onFailure: sink.error,
      onSuccess: sink.event,
    })
  }
}

export class FromSync<A> extends BaseFx<never, never, A> {
  readonly _tag = 'FromSync'
  readonly _type = 'Producer'

  constructor(readonly f: () => A) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, never, A>): Effect.Effect<R2, never, void> {
    return Effect.suspend(() => sink.event(this.f()))
  }
}

export class Suspend<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = 'Suspend'
  readonly _type = 'Producer'

  constructor(readonly f: () => Fx<R, E, A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, void> {
    return Effect.suspend(() => this.f().run(sink))
  }
}

export class Fusion<R, E, A> extends BaseFx<R, E, A> {
  readonly _tag = 'Fusion'
  readonly _type = 'Producer'

  constructor(
    readonly fx: Fx<any, any, any>,
    readonly frames: Chunk.Chunk<Fusion.AnyFrame>,
  ) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, void> {
    return this.fx.run(sink) // TODO: Compile the correct sink with frames
  }

  addFrame<R2, E2, B>(frame: Fusion.AnyFrame): Fusion<R2, E2, B> {
    const fused = Fusion.fuseFrame(Chunk.unsafeLast(this.frames), frame)

    if (Option.isSome(fused)) {
      return new Fusion(this.fx, this.frames.pipe(Chunk.dropRight(1), Chunk.appendAll(fused.value)))
    } else {
      return new Fusion(this.fx, this.frames.pipe(Chunk.append(frame)))
    }
  }
}

export function isProducer<R, E, A>(fx: Fx<R, E, A>): fx is Producer<R, E, A> {
  return fx instanceof BaseFx && fx._type === 'Producer'
}

export function isFusion<R, E, A>(fx: Fx<R, E, A>): fx is Fusion<R, E, A> {
  return fx instanceof Fusion
}

export function fusion<R, E, A, R2, E2, A2>(
  fx: Fx<R, E, A>,
  frame: Fusion.ContinuationFrame<A, R2, E2, A2>,
): Fx<R | R2, E | E2, A2>
export function fusion<R, E, A, R2, E2, A2>(
  fx: Fx<R, E, A>,
  frame: Fusion.ProvideLayerFrame<R2, E2, A2>,
): Fx<Exclude<R | R2, A2>, E | E2, A>
export function fusion<R, E, A, R2>(
  fx: Fx<R, E, A>,
  frame: Fusion.ProvideContextFrame<R2>,
): Fx<Exclude<R, R2>, E, A>
export function fusion<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  frame: Fusion.FilterMapLoopEffectFrame<R2, E2, A, B, C>,
): Fx<R | R2, E | E2, C>
export function fusion<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  frame: Fusion.FilterMapEffectFrame<R2, E2, A, B>,
): Fx<R | R2, E | E2, B>
export function fusion<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  frame: Fusion.FilterMapLoopFrame<A, B, C>,
): Fx<R, E, C>
export function fusion<R, E, A, B>(fx: Fx<R, E, A>, frame: Fusion.FilterMapFrame<A, B>): Fx<R, E, B>
export function fusion<R, E, A, B>(fx: Fx<R, E, A>, frame: Fusion.MapFrame<A, B>): Fx<R, E, B>
export function fusion<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, frame: Fusion.AnyFrame): Fx<R2, E2, B> {
  if (isFusion(fx)) {
    return fx.addFrame<R2, E2, B>(frame)
  } else {
    return new Fusion<R2, E2, B>(fx, Chunk.of(frame))
  }
}

/* #endregion */

export namespace Fusion {
  export type AnyFrames = readonly AnyFrame[]

  export type AnyFrame =
    | MapFrame<any, any>
    | FilterMapFrame<any, any>
    | FilterMapLoopFrame<any, any, any>
    | FilterMapEffectFrame<any, any, any, any>
    | FilterMapLoopEffectFrame<any, any, any, any, any>
    | ProvideContextFrame<any>
    | ProvideLayerFrame<any, any, any>
    | ContinuationFrame<any, any, any, any>
    | TapFrame<any, any, any, any>
    | StartWithFrame<any>
    | EndWithFrame<any>
    | EarlyExitFrame<any, any, any>
    | SliceFrame

  type FusionSpec = {
    readonly [Outer in AnyFrame['_tag']]?: {
      readonly [Inner in AnyFrame['_tag']]?: (
        outer: Extract<AnyFrame, { _tag: Outer }>,
        inner: Extract<AnyFrame, { _tag: Inner }>,
      ) => Chunk.Chunk<AnyFrame>
    }
  }

  const spec: FusionSpec = {
    Map: {
      Map: (first, second) => Chunk.of(new MapFrame((a) => second.f(first.f(a)))),
      FilterMap: (first, second) => Chunk.of(new FilterMapFrame((a) => second.f(first.f(a)))),
      FilterMapLoop: (first, second) =>
        Chunk.of(new FilterMapLoopFrame((b, a) => second.f(b, first.f(a)), second.initial)),
      FilterMapEffect: (first, second) =>
        Chunk.of(new FilterMapEffectFrame((a) => second.f(first.f(a)))),
      FilterMapLoopEffect: (first, second) =>
        Chunk.of(new FilterMapLoopEffectFrame((b, a) => second.f(b, first.f(a)), second.initial)),
    },
    FilterMap: {
      Map: (first, second) => Chunk.of(new FilterMapFrame((a) => Option.map(first.f(a), second.f))),
      FilterMap: (first, second) =>
        Chunk.of(new FilterMapFrame((a) => Option.flatMap(first.f(a), second.f))),
      FilterMapLoop: (first, second) =>
        Chunk.of(
          new FilterMapLoopFrame(
            (b, a) => Option.flatMap(first.f(a), (a) => second.f(b, a)),
            second.initial,
          ),
        ),
      FilterMapEffect: (first, second) =>
        Chunk.of(
          new FilterMapEffectFrame((a) =>
            Option.match(first.f(a), {
              onNone: () => Effect.succeedNone,
              onSome: second.f,
            }),
          ),
        ),
      FilterMapLoopEffect: (first, second) =>
        Chunk.of(
          new FilterMapLoopEffectFrame(
            (b, a) =>
              Option.match(first.f(a), {
                onNone: () => Effect.succeedNone,
                onSome: (a) => second.f(b, a),
              }),
            second.initial,
          ),
        ),
    },
    FilterMapLoop: {
      Map: (first, second) =>
        Chunk.of(
          new FilterMapLoopFrame(
            (b, a) => Option.map(first.f(b, a), ([value, acc]) => [second.f(value), acc]),
            first.initial,
          ),
        ),
    },
    FilterMapEffect: {
      Map: (first, second) =>
        Chunk.of(new FilterMapEffectFrame((a) => Effect.map(first.f(a), second.f))),
      FilterMap: (first, second) =>
        Chunk.of(new FilterMapEffectFrame((a) => Effect.map(first.f(a), Option.flatMap(second.f)))),
      FilterMapLoop: (first, second) =>
        Chunk.of(
          new FilterMapLoopEffectFrame(
            (b, a) =>
              Effect.map(
                first.f(a),
                Option.flatMap((a) => second.f(b, a)),
              ),
            second.initial,
          ),
        ),
      FilterMapEffect: (first, second) =>
        Chunk.of(
          new FilterMapEffectFrame((a) =>
            first
              .f(a)
              .pipe(
                Effect.flatMap(
                  Option.match({ onNone: () => Effect.succeedNone, onSome: second.f }),
                ),
              ),
          ),
        ),
      FilterMapLoopEffect: (first, second) =>
        Chunk.of(
          new FilterMapLoopEffectFrame(
            (b, a) =>
              first.f(a).pipe(
                Effect.flatMap(
                  Option.match({
                    onNone: () => Effect.succeedNone,
                    onSome: (a) => second.f(b, a),
                  }),
                ),
              ),
            second.initial,
          ),
        ),
    },
    ProvideContext: {
      ProvideContext: (first, second) =>
        Chunk.of(new ProvideContextFrame(Context.merge(second.context, first.context))),
      ProvideLayer: (first, second) =>
        Chunk.of(
          new ProvideLayerFrame(
            Layer.provideMerge(second.layer, Layer.succeedContext(first.context)),
          ),
        ),
    },
    ProvideLayer: {
      ProvideContext: (first, second) =>
        Chunk.of(
          new ProvideLayerFrame(
            Layer.provideMerge(Layer.succeedContext(second.context), first.layer),
          ),
        ),
      ProvideLayer: (first, second) =>
        Chunk.of(new ProvideLayerFrame(Layer.provideMerge(second.layer, first.layer))),
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export function fuseFrame(
    first: AnyFrame,
    second: AnyFrame,
  ): Option.Option<Chunk.Chunk<AnyFrame>> {
    if (first._tag in spec) {
      const innerSpec = spec[first._tag]

      if (innerSpec && second._tag in innerSpec) {
        return Option.some(innerSpec[second._tag]!(first as any, second as any))
      }
    }

    return Option.none()
  }

  export class MapFrame<A, B> {
    readonly _tag = 'Map' as const
    constructor(readonly f: (a: A) => B) {}
  }

  export class FilterMapFrame<A, B> {
    readonly _tag = 'FilterMap' as const
    constructor(readonly f: (a: A) => Option.Option<B>) {}
  }

  export class FilterMapLoopFrame<A, B, C> {
    readonly _tag = 'FilterMapLoop' as const
    constructor(
      readonly f: (b: B, a: A) => Option.Option<readonly [C, B]>,
      readonly initial: B,
    ) {}
  }

  export class FilterMapEffectFrame<R, E, A, B> {
    readonly _tag = 'FilterMapEffect' as const
    constructor(readonly f: (a: A) => Effect.Effect<R, E, Option.Option<B>>) {}
  }

  export class FilterMapLoopEffectFrame<R, E, A, B, C> {
    readonly _tag = 'FilterMapLoopEffect' as const
    constructor(
      readonly f: (b: B, a: A) => Effect.Effect<R, E, Option.Option<readonly [C, B]>>,
      readonly initial: B,
    ) {}
  }

  export class ProvideContextFrame<R> {
    readonly _tag = 'ProvideContext' as const
    constructor(readonly context: Context.Context<R>) {}
  }

  export class ProvideLayerFrame<R, E, A> {
    readonly _tag = 'ProvideLayer' as const
    constructor(readonly layer: Layer.Layer<R, E, A>) {}
  }

  export class ContinuationFrame<A, R2, E2, B> {
    readonly _tag = 'Continuation' as const
    constructor(
      readonly f: (a: A) => Fx<R2, E2, B>,
      readonly strategy: ContinuationStrategy,
    ) {}
  }

  export class TapFrame<A, R2, E2, B> {
    readonly _tag = 'Tap' as const
    constructor(readonly f: (a: A) => Fx<R2, E2, B>) {}
  }

  export type ContinuationStrategy =
    | ContinuationStrategy.None
    | ContinuationStrategy.Switch
    | ContinuationStrategy.Unbounded
    | ContinuationStrategy.Bounded
    | ContinuationStrategy.Exhaust
    | ContinuationStrategy.ExhaustLatest

  export namespace ContinuationStrategy {
    export class None {
      readonly _tag = 'None' as const
    }

    export class Switch {
      readonly _tag = 'Switch' as const
    }

    export class Unbounded {
      readonly _tag = 'Unbounded' as const
    }

    export class Bounded {
      readonly _tag = 'Bounded' as const
      constructor(readonly concurrency: number) {}
    }

    export class Exhaust {
      readonly _tag = 'Exhaust' as const
    }

    export class ExhaustLatest {
      readonly _tag = 'ExhaustLatest' as const
    }
  }

  export class StartWithFrame<A> {
    readonly _tag = 'StartWith' as const
    constructor(readonly values: Chunk.Chunk<A>) {}
  }

  export class EndWithFrame<A> {
    readonly _tag = 'EndWith' as const
    constructor(readonly values: Chunk.Chunk<A>) {}
  }

  export class EarlyExitFrame<A, B, C> {
    readonly _tag = 'EarlyExit' as const
    constructor(
      readonly f: (b: B, a: A) => Option.Option<readonly [C, B]>,
      readonly initial: B,
    ) {}
  }

  export class SliceFrame {
    readonly _tag = 'Slice' as const
    constructor(
      readonly skip: number,
      readonly take: number,
    ) {}
  }
}

// Fusion from frame to frame
// Fusion from effect to frame
// Fusion final Sink
//  - Drain should drop needless transformations

// Empty, Never, Success/Failure
// Sync + Async + Suspend
// Map
// Transducable/Effect
// Loop/Effect
// Provide, merge layers + context
// EarlyExit
// StartWith, EndWith
// Slice
// Merge
// Higher-order + Merging strategies
