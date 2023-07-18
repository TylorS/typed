import * as Context from '@effect/data/Context'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'

import { Fx } from './Fx.js'
import type { Sink } from './Fx.js'
import { switchMap } from './switchMap.js'

export function provideContext<R, E, A>(
  fx: Fx<R, E, A>,
  context: Context.Context<R>,
): Fx<never, E, A> {
  return Fx(
    <R2>(sink: Sink<R2, E, A>): Effect.Effect<R2, never, void> =>
      Effect.mapInputContext(fx.run(sink), (ctx) => Context.merge(ctx, context)),
  )
}

export function provideSomeContext<R, E, A, R2>(
  fx: Fx<R, E, A>,
  context: Context.Context<R2>,
): Fx<Exclude<R, R2>, E, A> {
  return Fx(
    <R3>(sink: Sink<R3, E, A>): Effect.Effect<Exclude<R, R2> | R3, never, void> =>
      Effect.mapInputContext(fx.run(sink), (ctx) =>
        Context.merge(ctx as Context.Context<R | R3>, context),
      ),
  )
}

export function provideLayer<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, R>,
): Fx<R2, E | E2, A> {
  return Fx((sink) => Effect.provideSomeLayer(fx.run(sink), layer) as any)
}

export function provideSomeLayer<R, E, A, R2, E2, S>(
  fx: Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, S>,
): Fx<Exclude<R, S> | R2, E | E2, A> {
  return Fx((sink) => Effect.provideSomeLayer(fx.run(sink), layer) as any)
}

export function provideService<R, E, A, I, S>(
  fx: Fx<R, E, A>,
  tag: Context.Tag<I, S>,
  service: S,
): Fx<Exclude<R, I>, E, A> {
  return provideSomeContext(fx, Context.make(tag, service))
}

export function provideServiceEffect<R, E, A, I, S, R2, E2>(
  fx: Fx<R, E, A>,
  tag: Context.Tag<I, S>,
  service: Effect.Effect<R2, E2, S>,
): Fx<Exclude<R, I> | R2, E | E2, A> {
  return Fx(
    <R3>(sink: Sink<R3, E | E2, A>): Effect.Effect<Exclude<R, I> | R2 | R3, never, void> =>
      Effect.matchCauseEffect(service, {
        onFailure: sink.error,
        onSuccess: (s) =>
          Effect.mapInputContext(fx.run(sink), (ctx) =>
            Context.merge(ctx as Context.Context<R | R2 | R3>, Context.make(tag, s)),
          ),
      }),
  )
}

export function provideServiceFx<R, E, A, I, S, R2, E2>(
  fx: Fx<R, E, A>,
  tag: Context.Tag<I, S>,
  service: Fx<R2, E2, S>,
): Fx<Exclude<R, I> | R2, E | E2, A> {
  return switchMap(service, (s) => provideService(fx, tag, s))
}
