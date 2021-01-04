import { doEffect, Effect, FailEnv } from '@fp/Effect/exports'
import { orFail } from '@fp/Future/exports'
import { chain, Resume, sync } from '@fp/Resume/exports'
import { Either, fold, left, map } from 'fp-ts/Either'
import { flow } from 'fp-ts/function'

import { KeyValueStorage } from '../KeyValueStorage'
import { createReadTransaction } from './createReadTransaction'
import { createWriteTransaction } from './createWriteTransaction'
import { idbRequestToResume } from './idbRequestToResume'
import { IndexedDbFactoryEnv } from './IndexedDbFactoryEnv'
import { openDatabase } from './openDatabase'

export const IndexedDBFailure = '@fp/Storage/IndexedDbFailure'
export type IndexedDBFailure = FailEnv<typeof IndexedDBFailure, Error>

/**
 * Create a KeyValueStorage implementation using indexed-db
 */
export function createIndexedDbKeyValueStorage<K extends IDBValidKey, V>(
  name: string,
): Effect<IndexedDbFactoryEnv & IndexedDBFailure, KeyValueStorage<K, V>> {
  const eff = doEffect(function* () {
    const database = yield* orFail(IndexedDBFailure, openDatabase(name))

    return createKeyValueStorageFromDatabase<K, V>(database)
  })

  return eff
}

function createKeyValueStorageFromDatabase<K extends IDBValidKey, V>(
  database: IDBDatabase,
): KeyValueStorage<K, V> {
  const read = () => createReadTransaction(database)
  const write = () => createWriteTransaction(database)

  const storage: KeyValueStorage<K, V> = {
    getKeys: () =>
      idbRequestToResume(read(), (s) => (s.getAllKeys() as IDBRequest<unknown>) as IDBRequest<K[]>),

    getItems: () => idbRequestToResume(read(), (s) => s.getAll()),

    getItem: (k) => idbRequestToResume(read(), (s) => s.get(k)),

    setItem: (k, v) =>
      mapResumeEither(
        idbRequestToResume(write(), (s) => s.put(v, k)),
        () => v,
      ),

    removeItem: (k) =>
      chainResumeEither(storage.getItem(k), (o) =>
        mapResumeEither(
          idbRequestToResume(write(), (s) => s.delete(k)),
          () => o,
        ),
      ),

    clearItems: () =>
      mapResumeEither(
        idbRequestToResume(write(), (s) => s.clear()),
        () => true,
      ),
  }

  return storage
}

const mapResumeEither = <A, B, C>(r: Resume<Either<A, B>>, f: (b: B) => C) =>
  chain(flow(map(f), sync), r)

const chainResumeEither = <A, B, C>(r: Resume<Either<A, B>>, f: (b: B) => Resume<Either<A, C>>) =>
  chain(fold(flow(left, sync), f), r)
