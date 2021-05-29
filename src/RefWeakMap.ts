import * as E from '@fp/Env'
import { pipe } from '@fp/function'
import { createRef, getRef, modifyRef_, Refs, WrappedRef } from '@fp/Ref'
import * as WM from '@fp/WeakMap'
import { EqStrict } from 'fp-ts/Eq'
import { constant, identity } from 'fp-ts/function'
import { match, Option } from 'fp-ts/Option'

export interface RefWeakMap<E, K extends object, V> extends WrappedRef<Refs, E, WeakMap<K, V>> {}

export const createRefWeakMap = <E, K extends object, V>(
  initial: E.Env<E, WeakMap<K, V>> = E.fromIO(() => new Map()),
  id: PropertyKey = Symbol(`RefWeakMap`),
): RefWeakMap<E, K, V> => createRef(initial, id, EqStrict)

export const fromValue = <K extends object, V>(id: PropertyKey = Symbol(`RefWeakMap`)) =>
  createRefWeakMap<unknown, K, V>(undefined, id)

export const fromId = <K extends object, V>() => <Id extends PropertyKey>(id: Id) =>
  createRefWeakMap(
    E.asks((e: Readonly<Record<Id, WeakMap<K, V>>>) => e[id]),
    id,
  )

export const lookup = <E, K extends object, V>(refMap: RefWeakMap<E, K, V>) => (
  key: K,
): E.Env<E & Refs, Option<V>> => pipe(refMap, getRef, E.map(WM.lookup(key)))

export const insertAt = <E, K extends object, V>(refMap: RefWeakMap<E, K, V>) => (
  key: K,
  value: V,
) =>
  pipe(
    refMap,
    modifyRef_((wm) => wm.set(key, value)),
    E.map(() => value),
  )

export const deleteAt = <E, K extends object, V>(refMap: RefWeakMap<E, K, V>) => (key: K) =>
  pipe(
    pipe(key, lookup(refMap)),
    E.chainFirst(() =>
      pipe(
        refMap,
        modifyRef_((map) => pipe(map, WM.deleteAt(key), match(constant(map), identity))),
      ),
    ),
  )
