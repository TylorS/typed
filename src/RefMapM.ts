/**
 * RefMapM is a collection of helpers for working with Refs that manage a mutable Map.
 * It utilizes standard JS reference-based keys.
 * @since 0.13.4
 */
import { Endomorphism } from 'fp-ts/Endomorphism'
import * as O from 'fp-ts/Option'
import { Predicate } from 'fp-ts/Predicate'

import * as E from './Env'
import * as EO from './EnvOption'
import { pipe } from './function'
import * as Ref from './Ref'

/**
 * @since 0.13.4
 * @category Model
 */
export interface RefMapM<E, K, V> extends Ref.Ref<E, Map<K, V>> {}

/**
 * @since 0.13.4
 * @category Combinator
 */
export const deleteAt =
  <K>(key: K) =>
  <E, V>(rm: RefMapM<E, K, V>) =>
    pipe(
      rm.get,
      E.tap((m) => m.delete(key)),
      E.chainFirstW(rm.set),
    )

/**
 * @since 0.13.4
 * @category Combinator
 */
export function filter<A>(predicate: Predicate<A>) {
  return <E, K>(rm: RefMapM<E, K, A>) =>
    rm.update((m) => {
      m.forEach((value, key) => {
        if (!predicate(value)) {
          m.delete(key)
        }
      })

      return E.of(m)
    })
}

/**
 * @since 0.13.4
 * @category Combinator
 */
export function filterWithIndex<K, V>(predicate: (k: K, v: V) => boolean) {
  return <E>(rm: RefMapM<E, K, V>) =>
    rm.update((m) => {
      m.forEach((value, key) => {
        if (!predicate(key, value)) {
          m.delete(key)
        }
      })

      return E.of(m)
    })
}

/**
 * @since 0.13.4
 * @category Combinator
 */
export const insertAt =
  <K, V>(key: K, value: V) =>
  <E>(rm: RefMapM<E, K, V>) =>
    pipe(
      rm.get,
      E.chainW((map) =>
        E.fromIO(() => {
          if (map.has(key)) {
            return O.none
          }

          map.set(key, value)

          return O.some(map)
        }),
      ),
      EO.chainFirstEnvK(rm.set),
    )

/**
 * @since 0.13.4
 * @category Combinator
 */
export const modifyAt = <K, V>(key: K, f: Endomorphism<V>) => {
  return <E>(rm: RefMapM<E, K, V>) =>
    pipe(
      rm.get,
      E.chainW((map) =>
        E.fromIO(() => {
          if (!map.has(key)) {
            return O.none
          }

          const v = map.get(key)!

          return O.some(map.set(key, f(v)))
        }),
      ),
      EO.chainFirstEnvK(rm.set),
    )
}

/**
 * @since 0.13.4
 * @category Combinator
 */
export const updateAt = <K, V>(key: K, value: V) => {
  return <E>(rm: RefMapM<E, K, V>) =>
    pipe(
      rm.get,
      E.chainW((map) =>
        E.fromIO(() => {
          if (!map.has(key)) {
            return O.none
          }

          return O.some(map.set(key, value))
        }),
      ),
      EO.chainFirstEnvK(rm.set),
    )
}

/**
 * @since 0.13.4
 * @category Combinator
 */
export const upsertAt =
  <K, V>(key: K, value: V) =>
  <E>(rm: RefMapM<E, K, V>) =>
    rm.update((map) =>
      E.fromIO(() => {
        map.set(key, value)

        return map
      }),
    )

/**
 * @since 0.13.4
 * @category Combinator
 */
export const getOrCreate =
  <K, E1, V>(key: K, create: E.Env<E1, V>) =>
  <E2>(rm: RefMapM<E2, K, V>) =>
    pipe(
      rm.get,
      E.map((map) => (map.has(key) ? O.some(map.get(key)!) : O.none)),
      EO.matchEW(
        () =>
          pipe(
            create,
            E.chainFirstW((v) => pipe(rm, upsertAt(key, v))),
          ),
        E.of,
      ),
    )
