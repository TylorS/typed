import { Disposable } from '@most/types'

/**
 * A Disposable indexed db transaction
 */
export interface IndexedDbStoreTransation extends Disposable {
  readonly transaction: IDBTransaction
  readonly store: IDBObjectStore
}
