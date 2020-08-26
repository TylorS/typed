import { Effect, fromEnv, Resume, sync } from '@typed/fp/Effect'
import { fromNullable, Option } from 'fp-ts/es6/Option'
import { flow } from 'fp-ts/lib/function'

export interface KeyValueStorageEnv<K, V> {
  readonly keyValueStorage: KeyValueStorage<K, V>
}

export type KeyValueStorage<K, V> = {
  readonly getKeys: () => Resume<ReadonlyArray<K>>
  readonly getItems: () => Resume<ReadonlyArray<V>>
  readonly getItem: (key: K) => Resume<Option<V>>
  readonly setItem: (key: K, value: V) => Resume<V>
  readonly removeItem: (key: K) => Resume<Option<V>>
  readonly clearItems: () => Resume<boolean> // whether or not items were actually cleared, used to signal support
}

export const getItem = <K, V = unknown>(key: K): Effect<KeyValueStorageEnv<K, V>, Option<V>> =>
  fromEnv((e) => e.keyValueStorage.getItem(key))

export const setItem = <K, V>(key: K, value: V): Effect<KeyValueStorageEnv<K, V>, V> =>
  fromEnv((e) => e.keyValueStorage.setItem(key, value))

export const removeItem = <K, V = unknown>(key: K): Effect<KeyValueStorageEnv<K, V>, Option<V>> =>
  fromEnv((e) => e.keyValueStorage.removeItem(key))

export const clearItems = fromEnv((e: KeyValueStorageEnv<unknown, unknown>) =>
  e.keyValueStorage.clearItems(),
)

export function wrapDomStorage(storage: Storage): KeyValueStorage<string, string> {
  const getItem = (key: string) => fromNullable(storage.getItem(key))

  return {
    getKeys: () => {
      const items: string[] = []

      for (let i = 0; i < storage.length; ++i) {
        const key = storage.key(i)

        if (key !== null) {
          items.push(key)
        }
      }

      return sync(items)
    },
    getItems: () => {
      const items: string[] = []

      for (let i = 0; i < storage.length; ++i) {
        const key = storage.key(i)

        if (key !== null) {
          items.push(storage.getItem(key)!)
        }
      }

      return sync(items)
    },
    getItem: flow(getItem, sync),
    setItem: (key, value) => (storage.setItem(key, value), sync(value)),
    removeItem: (key) => {
      const item = getItem(key)

      storage.removeItem(key)

      return sync(item)
    },
    clearItems: () => {
      storage.clear()

      return sync(true)
    },
  }
}
