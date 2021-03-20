import * as MA from '@most/adapter'
import * as M from '@most/core'
import { Stream } from '@most/types'
import { Contravariant2 } from 'fp-ts/dist/Contravariant'
import { flow } from 'fp-ts/dist/function'
import { Functor2 } from 'fp-ts/dist/Functor'
import { Predicate } from 'fp-ts/dist/Predicate'
import { Refinement } from 'fp-ts/dist/Refinement'

export const ContravariantURI = '@most/adapter/contravariant'
export type ContravariantURI = typeof ContravariantURI

export const CovariantURI = '@most/adapter/covariant'
export type CovariantURI = typeof CovariantURI

declare module 'fp-ts/dist/HKT' {
  export interface URItoKind2<E, A> {
    [ContravariantURI]: Adapter<A, E>
    [CovariantURI]: Adapter<E, A>
  }
}

export type Adapter<A, B = A> = readonly [...MA.Adapter<A, B>]

/**
 * Apply a stream transformation to an Adapter
 */
export const adapt = <A, B>(f: (stream: Stream<A>) => Stream<B>) => <C>([send, stream]: Adapter<
  C,
  A
>): Adapter<C, B> => [send, M.multicast(f(stream))]

export function create<A>(): Adapter<A>
export function create<A, B>(f: (stream: Stream<A>) => Stream<B>): Adapter<A, B>

export function create<A, B>(f?: (stream: Stream<A>) => Stream<B>) {
  const [send, stream] = MA.createAdapter<A>()

  return [send, f ? f(stream) : stream] as const
}

export function contramap<A, B>(f: (value: A) => B) {
  return <C>([send, stream]: Adapter<B, C>): Adapter<A, C> => [flow(f, send), stream]
}

export function map<A, B>(f: (value: A) => B): <C>(adapter: Adapter<C, A>) => Adapter<C, B> {
  return adapt(M.map(f))
}

export function filter<A, B extends A>(
  f: Refinement<A, B>,
): <C>(adapter: Adapter<C, A>) => Adapter<C, B>
export function filter<A>(f: Predicate<A>): <C>(adapter: Adapter<C, A>) => Adapter<C, A>

export function filter<A>(f: Predicate<A>): <C>(adapter: Adapter<C, A>) => Adapter<C, A> {
  return adapt(M.filter(f))
}

export const Contravariant: Contravariant2<ContravariantURI> = {
  contramap,
}

export const Functor: Functor2<CovariantURI> = {
  map,
}
