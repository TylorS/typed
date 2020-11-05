import { fromEnv } from '@typed/fp/Effect/exports'
import type { Future } from '@typed/fp/Future/exports'
import type { Resume } from '@typed/fp/Resume/exports'
import type { Either } from 'fp-ts/Either'
import type { Option } from 'fp-ts/Option'

export interface KeyValueStorageEnv<K, V> {
  readonly keyValueStorage: KeyValueStorage<K, V>
}

export type KeyValueStorage<K, V> = {
  readonly getKeys: () => Resume<Either<Error, ReadonlyArray<K>>>
  readonly getItems: () => Resume<Either<Error, ReadonlyArray<V>>>
  readonly getItem: (key: K) => Resume<Either<Error, Option<V>>>
  readonly setItem: (key: K, value: V) => Resume<Either<Error, V>>
  readonly removeItem: (key: K) => Resume<Either<Error, Option<V>>>
  readonly clearItems: () => Resume<Either<Error, boolean>> // whether or not items were actually cleared, used to signal support
}

export const getItem = <K, V = unknown>(
  key: K,
): Future<KeyValueStorageEnv<K, V>, Error, Option<V>> =>
  fromEnv((e) => e.keyValueStorage.getItem(key))

export const setItem = <K, V>(key: K, value: V): Future<KeyValueStorageEnv<K, V>, Error, V> =>
  fromEnv((e) => e.keyValueStorage.setItem(key, value))

export const removeItem = <K, V = unknown>(
  key: K,
): Future<KeyValueStorageEnv<K, V>, Error, Option<V>> =>
  fromEnv((e) => e.keyValueStorage.removeItem(key))

export const clearItems = fromEnv((e: KeyValueStorageEnv<unknown, unknown>) =>
  e.keyValueStorage.clearItems(),
)
