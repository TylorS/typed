import * as Context from '@fp-ts/data/Context'
import { pipe, identity } from '@fp-ts/data/Function'

// WTF?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as E from '../Effect/Effect.js'
import * as ops from '../Effect/operators.js'
import * as F from '../FiberRef/FiberRef.js'
import * as Ref from '../Ref.js'

export interface Layer<R, E, I, O>
  extends Ref.Ref<R, E, I, Context.Context<O>>,
    Layer.Ops<R, E, I, O> {}

export function Layer<R, E, A>(effect: E.Effect<R, E, Context.Context<A>>): FromFiberRef<R, E, A> {
  return Layer.fromRef(Ref.Ref(effect, { join: identity }))
}

export interface Effect<R, E, A> extends Layer<R, E, Context.Context<A>, A> {}
export interface RIO<R, A> extends Effect<R, never, A> {}
export interface IO<E, A> extends Effect<never, E, A> {}
export interface Of<A> extends IO<never, A> {}

export interface FromFiberRef<R, E, A>
  extends Layer<R, E, Context.Context<A>, A>,
    F.FiberRef<R, E, Context.Context<A>> {}

export interface FromService<A> extends FromFiberRef<never, never, A> {
  readonly service: A
}

export namespace Layer {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export type ResourcesOf<T> = T extends Layer<infer R, infer _E, infer _I, infer _O> ? R : never
  export type ErrorsOf<T> = T extends Layer<infer _R, infer E, infer _I, infer _O> ? E : never
  export type InputOf<T> = T extends Layer<infer _R, infer _E, infer I, infer _O> ? I : never
  export type OutputOf<T> = T extends Layer<infer _R, infer _E, infer _I, infer O> ? O : never
  /* eslint-enable @typescript-eslint/no-unused-vars */

  export interface MergeAll<Layers extends readonly Layer<any, any, any, any>[]>
    extends Layer<
      Ref.ResourcesOf<Layers[number]>,
      Ref.ErrorsOf<Layers[number]>,
      { readonly [K in keyof Layers]: Ref.InputOf<Layers[K]> },
      Layer.OutputOf<Layers[number]>
    > {}

  export interface Ops<R, E, I, O> {
    readonly ask: <S extends O>(tag: Context.Tag<S>) => E.Effect<R, E, S>
    readonly provide: <R2, E2, A>(_: E.Effect<R2, E2, A>) => E.Effect<R | Exclude<R2, O>, E | E2, A>
    readonly merge: <R2 = never, E2 = never, I2 = never, A = never>(
      that: Layer<R2, E2, I2, A>,
    ) => Layer<R | R2, E | E2, readonly [I, I2], O | A>
    readonly provideAndMerge: <R2, E2, I2, A>(
      that: Layer<R2, E2, I2, A>,
    ) => Layer<R | R2, E | E2, readonly [I, I2], O | A>
  }

  export function fromRef<Ref extends Ref.Ref<any, any, any, Context.Context<any>>>(
    ref: Ref,
  ): Ref &
    Layer.Ops<Ref.ResourcesOf<Ref>, Ref.ErrorsOf<Ref>, Ref.InputOf<Ref>, Layer.OutputOf<Ref>> {
    const layer: Ref &
      Layer.Ops<Ref.ResourcesOf<Ref>, Ref.ErrorsOf<Ref>, Ref.InputOf<Ref>, Layer.OutputOf<Ref>> = {
      ...ref,
      ask: (tag) => pipe(ref.get, ops.map(Context.unsafeGet(tag))),
      provide: (effect) => pipe(effect, ops.provideLayer(layer)),
      merge: (that) => pipe(layer, merge(that)),
      provideAndMerge: (that) => pipe(layer, provideAndMerge(that)),
    }

    return layer
  }
}

const empty = Context.empty()

const makeContext =
  <T>(tag: Context.Tag<T>) =>
  (t: T) =>
    Context.add(tag)(t)(empty)

export function fromEffect<A>(tag: Context.Tag<A>) {
  return <R, E>(effect: E.Effect<R, E, A>): FromFiberRef<R, E, A> =>
    Layer(ops.map(makeContext(tag))(effect))
}

export function fromFiberRef<R, E, A>(
  ref: F.FiberRef<R, E, Context.Context<A>>,
): FromFiberRef<R, E, A> {
  return fromRef(Ref.fromFiberRef(ref))
}

export const fromRef = Layer.fromRef

export function fromService<A>(tag: Context.Tag<A>) {
  return (service: A): FromService<A> => ({
    ...fromEffect(tag)(ops.of(service)),
    service,
  })
}

export function merge<R2, E2, I2, B>(that: Layer<R2, E2, I2, B>) {
  return <R, E, I, A>(
    self: Layer<R, E, I, A>,
  ): Layer.MergeAll<readonly [typeof self, typeof that]> => {
    return pipe(
      Ref.tuple(self, that),
      Ref.map(([a, b]) => Context.merge(a)(b)),
      Layer.fromRef,
    )
  }
}

export function mergeAll<Layers extends readonly Layer<any, any, any, any>[]>(
  ...layers: readonly [...Layers]
): Layer.MergeAll<Layers> {
  return pipe(
    Ref.tuple(...layers),
    Ref.map(mergeAllContext),
    Layer.fromRef,
  ) as Layer.MergeAll<Layers>
}

function mergeAllContext<Ctxs extends readonly [...Context.Context<any>[]]>(
  ctxs: Ctxs,
): Context.Context<Context.Tags<Ctxs[number]>> {
  return (
    ctxs.length === 0 ? Context.empty() : ctxs.reduce((a, b) => Context.merge(b)(a))
  ) as Context.Context<Context.Tags<Ctxs[number]>>
}

export function provideAndMerge<R2, E2, I2, B>(that: Layer<R2, E2, I2, B>) {
  return <R, E, I, A>(
    self: Layer<R | B, E, I, A>,
  ): Layer<Exclude<R, B> | R2, E | E2, readonly [I, I2], A | B> =>
    pipe(self, merge(that), Ref.provideLayer(that), Layer.fromRef)
}

export function addService<S>(tag: Context.Tag<S>) {
  return (service: S) =>
    <R, E, I, A>(
      self: Layer<R, E, I, A>,
    ): Layer<Exclude<R, S>, E, readonly [I, Context.Context<S>], A | S> =>
      pipe(self, provideAndMerge(fromService(tag)(service)))
}
