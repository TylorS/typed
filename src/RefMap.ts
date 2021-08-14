/**
 * RefMap is a collection of helpers for working with Refs that manage a Map.
 * @since 0.12.0
 */
import { Endomorphism } from 'fp-ts/Endomorphism'
import { Eq } from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { Predicate } from 'fp-ts/Predicate'
import * as RM from 'fp-ts/ReadonlyMap'
import { fst, snd } from 'fp-ts/Tuple2'

import * as E from './Env'
import * as EO from './EnvOption'
import { flow, pipe } from './function'
import * as Ref from './Ref'

/**
 * @since 0.12.0
 * @category Model
 */
export interface RefMap<E, K, V> extends Ref.Ref<E, ReadonlyMap<K, V>> {}

/**
 * @since 0.12.0
 * @category Combinator
 */
export const deleteAt = <K>(Eq: Eq<K>) => {
  return (key: K) => {
    const deleteAtKey = RM.deleteAt(Eq)(key)

    return <E, V>(rm: RefMap<E, K, V>) =>
      pipe(rm.get, E.map(deleteAtKey), EO.chainFirstEnvK(rm.set))
  }
}

/**
 * @since 0.12.0
 * @category Combinator
 */
export function filter<A>(predicate: Predicate<A>) {
  return <E, K>(rm: RefMap<E, K, A>) => rm.update(flow(RM.filter(predicate), E.of))
}

/**
 * @since 0.12.0
 * @category Combinator
 */
export function filterWithIndex<K, V>(predicate: (k: K, v: V) => boolean) {
  return <E>(rm: RefMap<E, K, V>) => rm.update(flow(RM.filterWithIndex(predicate), E.of))
}

/**
 * @since 0.12.0
 * @category Combinator
 */
export const insertAt = <K>(Eq: Eq<K>) => {
  return <V>(key: K, value: V) => {
    const insertAtKey = RM.insertAt(Eq)(key, value)

    return <E>(rm: RefMap<E, K, V>) => pipe(rm.get, E.map(insertAtKey), EO.chainFirstEnvK(rm.set))
  }
}

/**
 * @since 0.12.0
 * @category Combinator
 */
export const modifyAt = <K>(Eq: Eq<K>) => {
  return <V>(key: K, f: Endomorphism<V>) => {
    const modifyAtKey = RM.modifyAt(Eq)(key, f)

    return <E>(rm: RefMap<E, K, V>) => pipe(rm.get, E.map(modifyAtKey), EO.chainFirstEnvK(rm.set))
  }
}

/**
 * @since 0.12.0
 * @category Combinator
 */
export const pop =
  <K>(Eq: Eq<K>) =>
  (k: K) => {
    const popWithKey = RM.pop(Eq)(k)

    return <E, A>(rm: RefMap<E, K, A>): E.Env<E, O.Option<A>> =>
      pipe(rm.get, E.map(popWithKey), EO.chainFirstEnvK(flow(snd, rm.set)), EO.map(fst))
  }

/**
 * @since 0.12.0
 * @category Combinator
 */
export const updateAt = <K>(Eq: Eq<K>) => {
  return <V>(key: K, value: V) => {
    const updateAtKey = RM.updateAt(Eq)(key, value)

    return <E>(rm: RefMap<E, K, V>) => pipe(rm.get, E.map(updateAtKey), EO.chainFirstEnvK(rm.set))
  }
}

/**
 * @since 0.12.0
 * @category Combinator
 */
export const upsertAt = <K>(Eq: Eq<K>) => {
  return <V>(key: K, value: V) => {
    const upsertAtKey = RM.upsertAt(Eq)(key, value)

    return <E>(rm: RefMap<E, K, V>) => rm.update(flow(upsertAtKey, E.of))
  }
}
