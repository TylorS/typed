import * as Context from '@effect/data/Context'
import * as Debug from '@effect/data/Debug'
import { equals } from '@effect/data/Equal'
import * as Option from '@effect/data/Option'
import * as Equivalence from '@effect/data/typeclass/Equivalence'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Fx from '@typed/fx'

export interface Ref<I, R, E, A> extends Context.Tag<I, Fx.RefSubject<E, A>> {
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

  readonly layer: Layer.Layer<R, never, I>

  readonly provide: <R2, E2, A2>(
    effect: Effect.Effect<R2, E2, A2>,
  ) => Effect.Effect<R | Exclude<R2, I>, E2, A2>

  readonly provideFx: <R2, E2, A2>(fx: Fx.Fx<R2, E2, A2>) => Fx.Fx<R | Exclude<R2, I>, E2, A2>
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

      return Object.assign(tag, {
        identifier,
        eq,
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
        layer: Effect.toLayer(make, tag),
        provide: <R2, E2, A2>(effect: Effect.Effect<R2, E2, A2>) =>
          Effect.provideServiceEffect(effect, tag, make).traced(trace),
        provideFx: <R2, E2, A2>(fx: Fx.Fx<R2, E2, A2>) =>
          Fx.provideServiceEffect(fx, tag, make).addTrace(trace),
      }) satisfies Ref<I, R, E, A>
    },
)
