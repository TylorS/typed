import * as Context from '@fp-ts/data/Context'
import { pipe, identity } from '@fp-ts/data/Function'

import { Effect } from '../Effect/Effect.js'
import * as ops from '../Effect/operators.js'
import { FiberRef } from '../FiberRef/FiberRef.js'
import * as Ref from '../Ref.js'

export interface Layer<R, E, I, O> extends Ref.Ref<R, E, I, Context.Context<O>> {}

export function Layer<R, E, A>(effect: Effect<R, E, Context.Context<A>>): Layer.Effect<R, E, A> {
  return Ref.Ref(effect, { join: identity })
}

export namespace Layer {
  export interface Effect<R, E, A> extends Layer<R, E, Context.Context<A>, A> {}
  export interface RIO<R, A> extends Effect<R, never, A> {}
  export interface IO<E, A> extends Effect<never, E, A> {}
  export interface Of<A> extends IO<never, A> {}
}

const empty = Context.empty()

const makeContext =
  <T>(tag: Context.Tag<T>) =>
  (t: T) =>
    Context.add(tag)(t)(empty)

export function fromEffect<A>(tag: Context.Tag<A>) {
  return <R, E>(effect: Effect<R, E, A>): Layer.Effect<R, E, A> =>
    Layer(ops.map(makeContext(tag))(effect))
}

export function fromFiberRef<A>(tag: Context.Tag<A>) {
  return <R, E>(ref: FiberRef<R, E, A>): Layer.Effect<R, E, A> =>
    fromEffect(tag)(ops.getFiberRef(ref))
}

export function fromRef<A>(tag: Context.Tag<A>) {
  return <R, E, I>(ref: Ref.Ref<R, E, I, A>): Layer.Effect<R, E, A> => fromEffect(tag)(ref.get)
}

export function fromService<A>(tag: Context.Tag<A>) {
  return (service: A): Layer.Of<A> => fromEffect(tag)(ops.of(service))
}

export function merge<R2, E2, I2, B>(that: Layer<R2, E2, I2, B>) {
  return <R, E, I, A>(self: Layer<R, E, I, A>): Layer<R | R2, E | E2, readonly [I, I2], A | B> => {
    return pipe(
      Ref.tuple(self, that),
      Ref.map(([a, b]) => Context.merge(a)(b)),
    )
  }
}

export function provideAndMerge<R2, E2, I2, B>(that: Layer<R2, E2, I2, B>) {
  return <R, E, I, A>(
    self: Layer<R | B, E, I, A>,
  ): Layer<Exclude<R, B> | R2, E | E2, readonly [I, I2], A | B> =>
    pipe(self, merge(that), Ref.provideLayer(that))
}

export function addService<S>(tag: Context.Tag<S>) {
  return (service: S) =>
    <R, E, I, A>(
      self: Layer<R, E, I, A>,
    ): Layer<Exclude<R, S>, E, readonly [I, Context.Context<S>], A | S> =>
      pipe(self, provideAndMerge(fromService(tag)(service)))
}
