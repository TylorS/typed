import * as Context from '@effect/data/Context'
import { equals } from '@effect/data/Equal'
import * as Equivalence from '@effect/data/Equivalence'
import { identity, dual } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { IdentifierOf } from './identifier.js'

export interface Ref<I, R, E, A> extends Fx.Fx<I, E, A> {
  readonly tag: Context.Tag<I, Fx.RefSubject<E, A>>

  readonly eq: Equivalence.Equivalence<A>

  readonly get: Effect.Effect<I, E, A>

  readonly modifyEffect: <R2, E2, A2>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [A2, A]>,
  ) => Effect.Effect<I | R2, E | E2, A2>

  readonly modify: <A2>(f: (a: A) => readonly [A2, A]) => Effect.Effect<I, E, A2>

  readonly updateEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, A>,
  ) => Effect.Effect<I | R2, E | E2, A>

  readonly update: (f: (a: A) => A) => Effect.Effect<I, E, A>

  readonly set: (a: A) => Effect.Effect<I, E, A>

  readonly delete: Effect.Effect<I, E, Option.Option<A>>

  readonly mapEffect: <R2, E2, A2>(
    f: (a: A) => Effect.Effect<R2, E2, A2>,
  ) => Effect.Effect<I, never, Fx.Computed<R2, E | E2, A2>>

  readonly map: <A2>(f: (a: A) => A2) => Effect.Effect<I, never, Fx.Computed<never, E, A2>>

  readonly filterMapEffect: <R2, E2, A2>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<A2>>,
  ) => Effect.Effect<I, never, Fx.Filtered<R | R2, E | E2, A2>>

  readonly filterMap: <A2>(
    f: (a: A) => Option.Option<A2>,
  ) => Effect.Effect<I, never, Fx.Filtered<R, E, A2>>

  readonly filterEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>,
  ) => Effect.Effect<I, never, Fx.Filtered<R | R2, E | E2, A>>

  readonly filter: (f: (a: A) => boolean) => Effect.Effect<I, never, Fx.Filtered<R, E, A>>

  readonly filterNotEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>,
  ) => Effect.Effect<I, never, Fx.Filtered<R | R2, E | E2, A>>

  readonly filterNot: (f: (a: A) => boolean) => Effect.Effect<I, never, Fx.Filtered<R, E, A>>

  readonly layer: Layer.Layer<R, never, I>

  readonly provide: <R2, E2, A2>(
    effect: Effect.Effect<R2, E2, A2>,
  ) => Effect.Effect<R | Scope.Scope | Exclude<R2, I>, E2, A2>

  readonly provideFx: <R2, E2, A2>(
    fx: Fx.Fx<R2, E2, A2>,
  ) => Fx.Fx<R | Scope.Scope | Exclude<R2, I>, E2, A2>
}

const refVariance: Fx.Fx<any, any, any>[Fx.FxTypeId] = {
  _R: identity,
  _E: identity,
  _A: identity,
}

export const Ref: {
  <R, E, A>(
    initial: Effect.Effect<R, E, A>,
    eq?: Equivalence.Equivalence<A>,
  ): <const I>(identifier: I) => Ref<IdentifierOf<I>, R, E, A>

  <const I, R, E, A>(
    identifier: I,
    initial: Effect.Effect<R, E, A>,
    eq?: Equivalence.Equivalence<A>,
  ): Ref<IdentifierOf<I>, R, E, A>
} = dual(
  3,

  function Ref<const I, R, E, A>(
    identifier: I,
    initial: Effect.Effect<R, E, A>,
    eq: Equivalence.Equivalence<A> = equals,
  ): Ref<IdentifierOf<I>, R, E, A> {
    const tag = Context.Tag<IdentifierOf<I>, Fx.RefSubject<E, A>>(identifier)
    const make = Fx.makeRef(initial, eq)
    const fx = Fx.hold(Fx.fromFxEffect(tag))

    return {
      tag,
      eq,
      [Fx.FxTypeId]: refVariance,
      run: fx.run.bind(fx),
      get: Effect.flatMap(tag, (r) => r.get),
      modifyEffect: <R2, E2, A2>(f: (a: A) => Effect.Effect<R2, E2, readonly [A2, A]>) =>
        Effect.flatMap(tag, (r) => r.modifyEffect(f)),
      modify: <A2>(f: (a: A) => readonly [A2, A]) => Effect.flatMap(tag, (r) => r.modify(f)),
      updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) =>
        Effect.flatMap(tag, (r) => r.updateEffect(f)),
      update: (f: (a: A) => A) => Effect.flatMap(tag, (r) => r.update(f)),
      set: (a: A) => Effect.flatMap(tag, (r) => r.set(a)),
      delete: Effect.flatMap(tag, (r) => r.delete),
      mapEffect: <R2, E2, A2>(f: (a: A) => Effect.Effect<R2, E2, A2>) =>
        Effect.map(tag, (r) => r.mapEffect(f)),
      map: <A2>(f: (a: A) => A2) => Effect.map(tag, (r) => r.map(f)),
      layer: Layer.scoped(tag, make),
      filterMapEffect: <R2, E2, A2>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<A2>>) =>
        Effect.map(tag, (r) => r.filterMapEffect(f)),
      filterMap: <A2>(f: (a: A) => Option.Option<A2>) => Effect.map(tag, (r) => r.filterMap(f)),
      filterEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>) =>
        Effect.map(tag, (r) => r.filterEffect(f)),
      filter: (f: (a: A) => boolean) => Effect.map(tag, (r) => r.filter(f)),
      filterNotEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>) =>
        Effect.map(tag, (r) => r.filterNotEffect(f)),
      filterNot: (f: (a: A) => boolean) => Effect.map(tag, (r) => r.filterNot(f)),
      provide: <R2, E2, A2>(effect: Effect.Effect<R2, E2, A2>) =>
        Effect.provideServiceEffect(effect, tag, make),
      provideFx: <R2, E2, A2>(fx: Fx.Fx<R2, E2, A2>) => Fx.provideServiceEffect(fx, tag, make),
    } satisfies Ref<IdentifierOf<I>, R, E, A>
  },
)
