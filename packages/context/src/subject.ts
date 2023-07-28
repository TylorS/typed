import * as Context from '@effect/data/Context'
import { identity } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Fx from '@typed/fx'

import { IdentifierOf } from './identifier.js'

const subjectVariance: Fx.Fx<any, any, any>[Fx.FxTypeId] = {
  _R: identity,
  _E: identity,
  _A: identity,
}

export interface Subject<I, E, A> extends Fx.Fx<I, E, A> {
  readonly tag: Context.Tag<I, Fx.Subject<E, A>>

  readonly event: (a: A) => Effect.Effect<I, never, void>
  readonly error: (e: Cause.Cause<E>) => Effect.Effect<I, never, void>
  readonly end: () => Effect.Effect<I, never, void>

  readonly layer: Layer.Layer<never, never, I>

  readonly provide: <R2, E2, A2>(
    effect: Effect.Effect<R2, E2, A2>,
  ) => Effect.Effect<Exclude<R2, I>, E2, A2>

  readonly provideFx: <R2, E2, A2>(fx: Fx.Fx<R2, E2, A2>) => Fx.Fx<Exclude<R2, I>, E2, A2>
}

export const Subject =
  <E, A>() =>
  <const I>(identifier: I): Subject<IdentifierOf<I>, E, A> =>
    make(identifier, () => Fx.makeSubject<E, A>(), false)

export const HoldSubject =
  <E, A>() =>
  <const I>(identifier: I): Subject<IdentifierOf<I>, E, A> =>
    make(identifier, () => Fx.makeHoldSubject<E, A>(), true)

function make<const I, E, A>(
  id: I,
  f: () => Fx.Subject<E, A>,
  hold: boolean,
): Subject<IdentifierOf<I>, E, A> {
  const tag = Context.Tag<IdentifierOf<I>, Fx.Subject<E, A>>(id)
  const fx = hold ? Fx.hold(Fx.fromFxEffect(tag)) : Fx.multicast(Fx.fromFxEffect(tag))
  const layer = Layer.effect(tag, Effect.sync(f))

  return {
    tag,
    [Fx.FxTypeId]: subjectVariance,
    run: fx.run.bind(fx),
    event: (a: A) => Effect.flatMap(tag, (s) => s.event(a)),
    error: (e: Cause.Cause<E>) => Effect.flatMap(tag, (s) => s.error(e)),
    end: () => Effect.flatMap(tag, (s) => s.end()),
    layer,
    provide: Effect.provideSomeLayer(layer),
    provideFx: Fx.provideSomeLayer(layer),
  }
}
