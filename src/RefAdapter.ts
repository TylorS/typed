/**
 * RefAdapter is an abstraction over [Ref](./Ref.ts.md) and [Adapter](./Adapter.ts.md)
 * @since 0.11.0
 */
import { identity } from 'fp-ts/function'
import { Functor4 } from 'fp-ts/Functor'
import { Profunctor4 } from 'fp-ts/Profunctor'
import { fst, snd } from 'fp-ts/Tuple2'

import * as A from './Adapter'
import * as E from './Env'
import { pipe } from './function'
import * as RS from './ReaderStream'
import * as Ref from './Ref'

/**
 * RefAdapter is an abstraction of Refs that will output an Adapter to send and receive events through.
 * It utilizes the output of its Ref instead of the input so you will not find any combinators for
 * updating the Adapter in-place. This allows for creating a Functor + Profunctor instances
 * @since 0.11.0
 * @category Model
 */
export interface RefAdapter<E, I, A, B = A> extends Ref.Ref<E, I, A.Adapter<A, B>> {}

/**
 * @since 0.12.0
 * @category Combinator
 */
export function sendEvent<A>(event: A) {
  return <E, B, C>(ra: RefAdapter<E, B, A, C>): E.Env<E, void> =>
    pipe(
      ra.get,
      E.chainIOK(
        ([send]) =>
          () =>
            send(event),
      ),
    )
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function getSendEvent<E, A, B, C>(ra: RefAdapter<E, A, B, C>): E.Env<E, (event: B) => void> {
  return pipe(ra.get, E.map(fst))
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function getEvents<E, A, B, C>(ra: RefAdapter<E, A, B, C>): RS.ReaderStream<E, C> {
  return pipe(ra.get, E.map(snd), RS.fromEnv, RS.chainStreamK(identity))
}

/**
 * @since 0.12.0
 * @category Combinator
 */
export function listenToEvents<A, E1, B>(f: (value: A) => E.Env<E1, B>) {
  return <E2, C>(ra: RefAdapter<E2, C, B, A>): RS.ReaderStream<E1 & E2, B> =>
    pipe(ra, getEvents, RS.chainEnvK(f))
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function map<A, B>(f: (value: A) => B) {
  return <E, C, D>(ra: RefAdapter<E, C, D, A>): RefAdapter<E, C, D, B> =>
    pipe(ra, Ref.map(A.map(f)))
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function local<A, B>(f: (value: A) => B) {
  return <E, C, D>(ra: RefAdapter<E, C, B, D>): RefAdapter<E, C, A, D> =>
    pipe(ra, Ref.map(A.local(f)))
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const promap =
  <B, A, C, D>(f: (value: B) => A, g: (value: C) => D) =>
  <E, I>(adapter: RefAdapter<E, I, A, C>): RefAdapter<E, I, B, D> =>
    pipe(adapter, local(f), map(g))

/**
 * @since 0.11.0
 * @category URI
 */
export const URI = '@typed/fp/RefAdapter'
/**
 * @since 0.11.0
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind4<S, R, E, A> {
    [URI]: RefAdapter<S, R, E, A>
  }
}

declare module './HKT' {
  export interface URItoVariance {
    [URI]: V<S, Contravariant> & V<R, Contravariant>
  }
}

/**
 * @since 0.11.0
 * @category Instance
 */
export const Functor: Functor4<URI> = {
  map,
}

/**
 * @since 0.11.0
 * @category Instance
 */
export const Profunctor: Profunctor4<URI> = {
  map,
  promap,
}

/**
 * @since 0.13.5
 * @category Instance
 */
export function wrap<E, I, A, B>(ra: RefAdapter<E, I, A, B>) {
  return {
    ...ra,
    sendEvent: (event: A) => pipe(ra, sendEvent(event)),
    getSendEvent: getSendEvent(ra),
    listenToEvents: <E2>(f: (value: B) => E.Env<E2, A>) => pipe(ra, listenToEvents(f)),
  } as const
}
