import { lazy } from '@fp/Disposable/exports'
import { fromEnv } from '@fp/Effect/exports'
import { Future } from '@fp/Future/exports'
import { asyncEither } from '@fp/Resume/exports'

import { IndexedDbFactoryEnv } from './IndexedDbFactoryEnv'

/**
 * Open a database at a specific name.
 */
export function openDatabase(name: string): Future<IndexedDbFactoryEnv, Error, IDBDatabase> {
  return fromEnv((e: IndexedDbFactoryEnv) =>
    asyncEither((left, right) => {
      const request = e.indexedDbFactory.open(name)
      const disposable = lazy()

      request.onerror = (ev) =>
        !disposable.disposed &&
        disposable.addDisposable(left(new Error((ev.target as any).errorCode)))

      request.onsuccess = () =>
        !disposable.disposed && disposable.addDisposable(right(request.result))

      request.onupgradeneeded = () => request.result.createObjectStore(name)

      return disposable
    }),
  )
}
