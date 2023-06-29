import * as Context from '@effect/data/Context'
import * as Debug from '@effect/data/Debug'
import { equals } from '@effect/data/Equal'
import { identity } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Equivalence from '@effect/data/typeclass/Equivalence'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

export interface Ref<I, R, E, A> extends Context.Tag<I, Fx.RefSubject<E, A>>, Fx.Fx<I, E, A> {
  readonly identifier: I

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
  <R, E, A>(initial: Effect.Effect<R, E, A>, eq?: Equivalence.Equivalence<A>): <const I>(
    identifier: I,
  ) => Ref<I, R, E, A>

  <const I, R, E, A>(
    identifier: I,
    initial: Effect.Effect<R, E, A>,
    eq?: Equivalence.Equivalence<A>,
  ): Ref<I, R, E, A>
} = Debug.dualWithTrace(
  3,
  (trace) =>
    function Ref<const I, R, E, A>(
      identifier: I,
      initial: Effect.Effect<R, E, A>,
      eq: Equivalence.Equivalence<A> = equals,
    ): Ref<I, R, E, A> {
      const tag = Context.Tag<I, Fx.RefSubject<E, A>>(identifier)
      const make = Fx.makeRef(initial, eq).traced(trace)
      const fx = Fx.hold(Fx.fromFxEffect(tag))

      return Object.assign(tag, {
        identifier,
        eq,
        [Fx.FxTypeId]: refVariance,
        run: fx.run.bind(fx),
        addTrace: fx.addTrace.bind(fx),
        get: Effect.flatMap(tag, (r) => r.get).traced(trace),
        modifyEffect: <R2, E2, A2>(f: (a: A) => Effect.Effect<R2, E2, readonly [A2, A]>) =>
          Effect.flatMap(tag, (r) => r.modifyEffect(f)).traced(trace),
        modify: <A2>(f: (a: A) => readonly [A2, A]) =>
          Effect.flatMap(tag, (r) => r.modify(f)).traced(trace),
        updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) =>
          Effect.flatMap(tag, (r) => r.updateEffect(f)).traced(trace),
        update: (f: (a: A) => A) => Effect.flatMap(tag, (r) => r.update(f)).traced(trace),
        set: (a: A) => Effect.flatMap(tag, (r) => r.set(a)).traced(trace),
        delete: Effect.flatMap(tag, (r) => r.delete).traced(trace),
        mapEffect: <R2, E2, A2>(f: (a: A) => Effect.Effect<R2, E2, A2>) =>
          Effect.map(tag, (r) => r.mapEffect(f)).traced(trace),
        map: <A2>(f: (a: A) => A2) => Effect.map(tag, (r) => r.map(f)).traced(trace),
        layer: Effect.toLayerScoped(make, tag),
        filterMapEffect: <R2, E2, A2>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<A2>>) =>
          Effect.map(tag, (r) => r.filterMapEffect(f)).traced(trace),
        filterMap: <A2>(f: (a: A) => Option.Option<A2>) =>
          Effect.map(tag, (r) => r.filterMap(f)).traced(trace),
        filterEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>) =>
          Effect.map(tag, (r) => r.filterEffect(f)).traced(trace),
        filter: (f: (a: A) => boolean) => Effect.map(tag, (r) => r.filter(f)).traced(trace),
        filterNotEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>) =>
          Effect.map(tag, (r) => r.filterNotEffect(f)).traced(trace),
        filterNot: (f: (a: A) => boolean) => Effect.map(tag, (r) => r.filterNot(f)).traced(trace),
        provide: <R2, E2, A2>(effect: Effect.Effect<R2, E2, A2>) =>
          Effect.provideServiceEffect(effect, tag, make).traced(trace),
        provideFx: <R2, E2, A2>(fx: Fx.Fx<R2, E2, A2>) =>
          Fx.provideServiceEffect(fx, tag, make).addTrace(trace),
      }) satisfies Ref<I, R, E, A>
    },
)
