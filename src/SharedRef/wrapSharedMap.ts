import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { none, Option, some } from 'fp-ts/Option'

import { readSharedRef } from './readSharedRef'
import { SharedRef, SharedRefEnv } from './SharedRef'

export const wrapSharedMap = <RK extends PropertyKey, K, V>(
  ref: SharedRef<RK, Map<K, V>>,
): WrappedSharedMap<RK, K, V> => {
  return {
    get: getMap(ref),
    set: setMap(ref),
    has: hasMap(ref),
    delete: deleteMap(ref),
    clear: clearMap(ref),
    size: sizeMap(ref),
    entries: entriesMap(ref),
    keys: keysMap(ref),
    values: valuesMap(ref),
  }
}

export type WrappedSharedMap<RK extends PropertyKey, K, V> = {
  readonly get: (key: K) => Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, Option<V>>
  readonly has: (key: K) => Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, boolean>
  readonly set: (key: K, value: V) => Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, V>
  readonly delete: (key: K) => Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, Option<V>>
  readonly clear: Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, void>
  readonly size: Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, number>
  readonly entries: Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, Iterable<readonly [K, V]>>
  readonly keys: Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, Iterable<K>>
  readonly values: Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, Iterable<V>>
}

function getMap<RK extends PropertyKey, K, V>(ref: SharedRef<RK, Map<K, V>>) {
  return (key: K): Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, Option<V>> => {
    const eff = doEffect(function* () {
      const x: Map<K, V> = yield* readSharedRef(ref)

      return x.has(key) ? some(x.get(key)!) : none
    })

    return eff
  }
}

function hasMap<RK extends PropertyKey, K, V>(ref: SharedRef<RK, Map<K, V>>) {
  return (key: K): Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, boolean> => {
    const eff = doEffect(function* () {
      const x: Map<K, V> = yield* readSharedRef(ref)

      return x.has(key)
    })

    return eff
  }
}

function setMap<RK extends PropertyKey, K, V>(ref: SharedRef<RK, Map<K, V>>) {
  return (key: K, value: V): Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, V> => {
    const eff = doEffect(function* () {
      const x: Map<K, V> = yield* readSharedRef(ref)

      x.set(key, value)

      return value
    })

    return eff
  }
}

function deleteMap<RK extends PropertyKey, K, V>(ref: SharedRef<RK, Map<K, V>>) {
  return (key: K): Effect<SharedRefEnv<SharedRef<RK, Map<K, V>>>, Option<V>> => {
    const eff = doEffect(function* () {
      const x: Map<K, V> = yield* readSharedRef(ref)
      const value = x.has(key) ? some(x.get(key)!) : none

      x.delete(key)

      return value
    })

    return eff
  }
}

function clearMap<RK extends PropertyKey, K, V>(ref: SharedRef<RK, Map<K, V>>) {
  const eff = doEffect(function* () {
    const x: Map<K, V> = yield* readSharedRef(ref)

    x.clear()
  })

  return eff
}

function sizeMap<RK extends PropertyKey, K, V>(ref: SharedRef<RK, Map<K, V>>) {
  const eff = doEffect(function* () {
    const x: Map<K, V> = yield* readSharedRef(ref)

    return x.size
  })

  return eff
}

function entriesMap<RK extends PropertyKey, K, V>(ref: SharedRef<RK, Map<K, V>>) {
  const eff = doEffect(function* () {
    const x: Map<K, V> = yield* readSharedRef(ref)

    return x.entries()
  })

  return eff
}

function keysMap<RK extends PropertyKey, K, V>(ref: SharedRef<RK, Map<K, V>>) {
  const eff = doEffect(function* () {
    const x: Map<K, V> = yield* readSharedRef(ref)

    return x.keys()
  })

  return eff
}

function valuesMap<RK extends PropertyKey, K, V>(ref: SharedRef<RK, Map<K, V>>) {
  const eff = doEffect(function* () {
    const x: Map<K, V> = yield* readSharedRef(ref)

    return x.values()
  })

  return eff
}
