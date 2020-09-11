import { chainResume } from '@typed/fp/Effect/chainResume'
import { doEffect, Effect, FailEnv, Resume, sync } from '@typed/fp/Effect/exports'
import { orFail } from '@typed/fp/Future/exports'
import { Either, fold, left, map } from 'fp-ts/es6/Either'
import { flow } from 'fp-ts/es6/function'

import { KeyValueStorage } from '../KeyValueStorage'
import { createReadTransaction } from './createReadTransaction'
import { createWriteTransaction } from './createWriteTransaction'
import { idbRequestToResume } from './idbRequestToResume'
import { IndexedDbFactoryEnv } from './IndexedDbFactoryEnv'
import { openDatabase } from './openDatabase'

export const IndexedDBFailure = Symbol('@typed/fp/Storage/IndexedDbFailure')
export type IndexedDBFailure = FailEnv<typeof IndexedDBFailure, Error>

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
  chainResume(r, flow(map(f), sync))

const chainResumeEither = <A, B, C>(r: Resume<Either<A, B>>, f: (b: B) => Resume<Either<A, C>>) =>
  chainResume(r, fold(flow(left, sync), f))
