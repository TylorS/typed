import * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import { NonEmptyReadonlyArray } from '@fp-ts/data/ReadonlyArray'

import * as Effect from './Effect.js'
import * as Fiber from './Fiber.js'
import { Layer } from './Layer.js'
import { flow2 } from './_internal.js'

export function provideService<S>(tag: Context.Tag<S>, service: S) {
  const addService = Context.add(tag)(service)

  return <R, E, A>(effect: Effect.Effect<R | S, E, A>): Effect.Effect<Exclude<R, S>, E, A> =>
    Effect.access((env) => pipe(effect, Effect.provide(addService(env as Context.Context<R>))))
}

export function provideLayer<R2, E2, S>(layer: Layer<R2, E2, S>) {
  return <R, E, A>(
    effect: Effect.Effect<R | S, E, A>,
  ): Effect.Effect<R2 | Exclude<R, S>, E | E2, A> =>
    Effect.access((env) =>
      pipe(
        layer,
        Effect.getFiberRef,
        Effect.flatMap((env2) =>
          pipe(effect, Effect.provide(Context.merge(env2)(env as Context.Context<R | R2>))),
        ),
      ),
    )
}

export function asksEffect<S, R, E, A>(
  tag: Context.Tag<S>,
  f: (s: S) => Effect.Effect<R, E, A>,
): Effect.Effect<R | S, E, A> {
  return Effect.access((env: Context.Context<S>) => pipe(env, Context.unsafeGet(tag), f))
}

export function ask<S>(tag: Context.Tag<S>): Effect.Effect<S, never, S> {
  return asksEffect(tag, Effect.of)
}

export function asks<S, A>(tag: Context.Tag<S>, f: (s: S) => A): Effect.Effect<S, never, A> {
  return asksEffect(tag, flow2(f, Effect.of))
}

export function zip<R2, E2, B>(second: Effect.Effect<R2, E2, B>) {
  return <R, E, A>(first: Effect.Effect<R, E, A>): Effect.Effect<R | R2, E | E2, readonly [A, B]> =>
    pipe(
      first,
      Effect.fork,
      Effect.flatMap((fiberF) =>
        pipe(
          second,
          Effect.fork,
          Effect.map((fiberS) => Fiber.zip(fiberS)(fiberF)),
        ),
      ),
      Effect.flatMap(Effect.join),
    )
}

export function zipAll<Effs extends ReadonlyArray<Effect.Effect<any, any, any>>>(
  effects: Effs,
): Effect.Effect<
  Effect.Effect.ServicesOf<Effs[number]>,
  Effect.Effect.ErrorsOf<Effs[number]>,
  {
    readonly [K in keyof Effs]: Effect.Effect.OutputOf<Effs[K]>
  }
> {
  type R = Effect.Effect<
    Effect.Effect.ServicesOf<Effs[number]>,
    Effect.Effect.ErrorsOf<Effs[number]>,
    {
      readonly [K in keyof Effs]: Effect.Effect.OutputOf<Effs[K]>
    }
  >

  if (effects.length === 0) {
    return Effect.of([]) as unknown as R
  } else if (effects.length === 1) {
    return pipe(
      effects[0],
      Effect.map((a) => [a]),
    ) as unknown as R
  }

  const [first, ...rest] = effects

  return rest.reduce(
    (prev, cur) =>
      pipe(
        prev,
        zip(cur),
        Effect.map(([acc, x]) => [...acc, x]),
      ),
    pipe(
      first,
      Effect.map((x) => [x]),
    ),
  ) as R
}

export function race<R2, E2, B>(second: Effect.Effect<R2, E2, B>) {
  return <R, E, A>(first: Effect.Effect<R, E, A>): Effect.Effect<R | R2, E | E2, A | B> =>
    pipe(
      first,
      Effect.fork,
      Effect.flatMap((fiberF) =>
        pipe(
          second,
          Effect.fork,
          Effect.map((fiberS) => Fiber.race(fiberS)(fiberF)),
        ),
      ),
      Effect.flatMap(Effect.join),
    )
}

export function raceAll<Effs extends NonEmptyReadonlyArray<Effect.Effect<any, any, any>>>(
  effects: Effs,
): Effect.Effect<
  Effect.Effect.ServicesOf<Effs[number]>,
  Effect.Effect.ErrorsOf<Effs[number]>,
  Effect.Effect.OutputOf<Effs[number]>
> {
  type R = Effect.Effect<
    Effect.Effect.ServicesOf<Effs[number]>,
    Effect.Effect.ErrorsOf<Effs[number]>,
    Effect.Effect.OutputOf<Effs[number]>
  >

  if (effects.length === 1) {
    return effects[0] as R
  }

  return effects.reduce((prev, cur) => race(cur)(prev)) as R
}
