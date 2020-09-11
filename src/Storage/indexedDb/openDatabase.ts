import { lazy } from '@typed/fp/Disposable/exports'
import { asyncEither, fromEnv } from '@typed/fp/Effect/exports'
import { Future } from '@typed/fp/Future/exports'

import { IndexedDbFactoryEnv } from './IndexedDbFactoryEnv'

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
