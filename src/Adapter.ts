import * as MA from '@most/adapter'
import * as M from '@most/core'
import { Stream } from '@most/types'
import { flow, pipe } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Predicate } from 'fp-ts/Predicate'
import { Profunctor2 } from 'fp-ts/Profunctor'
import { Refinement } from 'fp-ts/Refinement'

export const URI = '@most/adapter'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Adapter<E, A>
  }
}

export type Adapter<A, B = A> = readonly [...MA.Adapter<A, B>]

/**
 * Apply a stream transformation to an Adapter
 */
export const adapt =
  <A, B>(f: (stream: Stream<A>) => Stream<B>) =>
  <C>([send, stream]: Adapter<C, A>): Adapter<C, B> =>
    [send, M.multicast(f(stream))]

export function create<A>(): Adapter<A>
export function create<A, B>(f: (stream: Stream<A>) => Stream<B>): Adapter<A, B>

export function create<A, B>(f?: (stream: Stream<A>) => Stream<B>) {
  const [send, stream] = MA.createAdapter<A>()

  return [send, f ? f(stream) : stream] as const
}

export function local<A, B>(f: (value: A) => B) {
  return <C>([send, stream]: Adapter<B, C>): Adapter<A, C> => [flow(f, send), stream]
}

export function map<A, B>(f: (value: A) => B): <C>(adapter: Adapter<C, A>) => Adapter<C, B> {
  return adapt(M.map(f))
}

export const promap =
  <B, A, C, D>(f: (value: B) => A, g: (value: C) => D) =>
  (adapter: Adapter<A, C>): Adapter<B, D> =>
    pipe(adapter, local(f), map(g))

export function filter<A, B extends A>(
  f: Refinement<A, B>,
): <C>(adapter: Adapter<C, A>) => Adapter<C, B>
export function filter<A>(f: Predicate<A>): <C>(adapter: Adapter<C, A>) => Adapter<C, A>

export function filter<A>(f: Predicate<A>): <C>(adapter: Adapter<C, A>) => Adapter<C, A> {
  return adapt(M.filter(f))
}

export const Functor: Functor2<URI> = {
  map,
}

export const Profunctor: Profunctor2<URI> = {
  ...Functor,
  promap,
}
