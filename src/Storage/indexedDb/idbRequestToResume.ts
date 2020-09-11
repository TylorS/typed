import { lazy } from '@typed/fp/Disposable/exports'
import { Async, asyncEither } from '@typed/fp/Effect/exports'
import { Either } from 'fp-ts/Either'

import { IndexedDbStoreTransation } from './IndexedDbStoreTransaction'

export interface IDBRequestEnv {
  readonly tx: IndexedDbStoreTransation
}

export function idbRequestToResume<A>(
  tx: IndexedDbStoreTransation,
  f: (store: IDBObjectStore) => IDBRequest<A>,
): Async<Either<Error, A>> {
  return asyncEither((left, right) => {
    const disposable = lazy()

    disposable.addDisposable(tx)

    const request = f(tx.store)

    request.onerror = (ev) =>
      !disposable.disposed &&
      disposable.addDisposable(left(new Error((ev.target as any).errorCode)))

    request.onsuccess = () =>
      !disposable.disposed && disposable.addDisposable(right(request.result))

    return disposable
  })
}
