import { doEffect, Effect } from '@typed/fp/Effect/exports'

import { readSharedRef } from './readSharedRef'
import { SharedRef, SharedRefEnv } from './SharedRef'

export const wrapSharedSet = <K extends PropertyKey, V>(ref: SharedRef<K, Set<V>>) => ({
  add: addSet(ref),
  clear: clearSet(ref),
  delete: deleteSet(ref),
  has: hasSet(ref),
  size: sizeSet(ref),
  values: valuesSet(ref),
})

function addSet<K extends PropertyKey, V>(ref: SharedRef<K, Set<V>>) {
  return (value: V): Effect<SharedRefEnv<SharedRef<K, Set<V>>>, V> => {
    const eff = doEffect(function* () {
      const set = yield* readSharedRef(ref)

      set.add(value)

      return value
    })

    return eff
  }
}

function clearSet<K extends PropertyKey, V>(ref: SharedRef<K, Set<V>>) {
  const eff = doEffect(function* () {
    const set = yield* readSharedRef(ref)

    set.clear()
  })

  return eff
}

function deleteSet<K extends PropertyKey, V>(ref: SharedRef<K, Set<V>>) {
  return (value: V): Effect<SharedRefEnv<SharedRef<K, Set<V>>>, V> => {
    const eff = doEffect(function* () {
      const set = yield* readSharedRef(ref)

      set.delete(value)

      return value
    })

    return eff
  }
}

function hasSet<K extends PropertyKey, V>(ref: SharedRef<K, Set<V>>) {
  return (value: V): Effect<SharedRefEnv<SharedRef<K, Set<V>>>, boolean> => {
    const eff = doEffect(function* () {
      const set = yield* readSharedRef(ref)

      return set.has(value)
    })

    return eff
  }
}

function sizeSet<K extends PropertyKey, V>(ref: SharedRef<K, Set<V>>) {
  const eff = doEffect(function* () {
    const set = yield* readSharedRef(ref)

    return set.size
  })

  return eff
}

function valuesSet<K extends PropertyKey, V>(ref: SharedRef<K, Set<V>>) {
  const eff = doEffect(function* () {
    const set = yield* readSharedRef(ref)

    return set.values()
  })

  return eff
}
