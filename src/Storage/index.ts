import { Effect, fromEnv, Resume } from '@typed/fp/Effect'
import { Option } from 'fp-ts/es6/Option'

export interface KeyValueStorageEnv<K, V> {
  readonly keyValueStorage: KeyValueStorage<K, V>
}

export type KeyValueStorage<K, V> = {
  readonly getItem: (key: K) => Resume<Option<V>>
  readonly setItem: (key: K, value: V) => Resume<V>
  readonly removeItem: (key: K) => Resume<Option<V>>
  readonly clearItems: Resume<boolean> // whether or not items were actually cleared, used to signal support
}

export const getItem = <K, V = unknown>(key: K): Effect<KeyValueStorageEnv<K, V>, Option<V>> =>
  fromEnv((e) => e.keyValueStorage.getItem(key))

export const setItem = <K, V>(key: K, value: V): Effect<KeyValueStorageEnv<K, V>, V> =>
  fromEnv((e) => e.keyValueStorage.setItem(key, value))

export const removeItem = <K, V = unknown>(key: K): Effect<KeyValueStorageEnv<K, V>, Option<V>> =>
  fromEnv((e) => e.keyValueStorage.removeItem(key))

export const clearItems = fromEnv(
  (e: KeyValueStorageEnv<unknown, unknown>) => e.keyValueStorage.clearItems,
)
