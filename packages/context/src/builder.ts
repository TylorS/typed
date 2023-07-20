import * as C from '@effect/data/Context'
import { dual, pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import type * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

export interface ContextBuilder<I> {
  readonly context: C.Context<I>
  readonly add: <I2, S>(tag: C.Tag<I2, S>, s: S) => ContextBuilder<I | I2>
  readonly merge: <I2>(builder: ContextBuilder<I2>) => ContextBuilder<I | I2>
  readonly mergeContext: <I2>(context: C.Context<I2>) => ContextBuilder<I | I2>
  readonly pick: <S extends ReadonlyArray<C.ValidTagsById<I>>>(
    ...tags: S
  ) => ContextBuilder<C.Tag.Identifier<S[number]>>
}

export namespace ContextBuilder {
  export const empty: ContextBuilder<never> = fromContext(C.empty())

  export function fromContext<I>(context: C.Context<I>): ContextBuilder<I> {
    return {
      context,
      add: <I2, S>(tag: C.Tag<I2, S>, s: S) => fromContext(C.add(context, tag, s)),
      merge: <I2>(builder: ContextBuilder<I2>) => fromContext(C.merge(context, builder.context)),
      mergeContext: <I2>(ctx: C.Context<I2>) => fromContext(C.merge(context, ctx)),
      pick: (...tags) => fromContext(pipe(context, C.pick(...tags))),
    }
  }

  export function fromTag<I, S>(tag: C.Tag<I, S>, s: S): ContextBuilder<I> {
    return fromContext(C.make(tag, s))
  }
}

export const provideContextBuilder: {
  <R>(
    builder: ContextBuilder<R>,
  ): <E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<never, E, A>
  <R, E, A>(effect: Effect.Effect<R, E, A>, builder: ContextBuilder<R>): Effect.Effect<never, E, A>
} = dual(
  2,
  <R, E, A>(
    effect: Effect.Effect<R, E, A>,
    builder: ContextBuilder<R>,
  ): Effect.Effect<never, E, A> => Effect.provideContext(effect, builder.context),
)

export const provideContextBuilderFx: {
  <R>(builder: ContextBuilder<R>): <E, A>(fx: Fx.Fx<R, E, A>) => Fx.Fx<never, E, A>
  <R, E, A>(fx: Fx.Fx<R, E, A>, builder: ContextBuilder<R>): Fx.Fx<never, E, A>
} = dual(
  2,
  <R, E, A>(fx: Fx.Fx<R, E, A>, builder: ContextBuilder<R>): Fx.Fx<never, E, A> =>
    Fx.provideContext(fx, builder.context),
)

export function effectContextBuilder<R, E, I>(
  effect: Effect.Effect<R, E, ContextBuilder<I>>,
): Layer.Layer<R, E, I> {
  return Layer.effectContext(Effect.map(effect, (builder) => builder.context))
}

export function syncContextBuilder<I>(f: () => ContextBuilder<I>): Layer.Layer<never, never, I> {
  return Layer.syncContext(() => f().context)
}

export function scopedContextBuilder<R, E, I>(
  effect: Effect.Effect<R, E, ContextBuilder<I>>,
): Layer.Layer<Exclude<R, Scope.Scope>, E, I> {
  return Layer.scopedContext(Effect.map(effect, (builder) => builder.context))
}

export function succeedContextBuilder<I>(builder: ContextBuilder<I>): Layer.Layer<never, never, I> {
  return Layer.succeedContext(builder.context)
}
