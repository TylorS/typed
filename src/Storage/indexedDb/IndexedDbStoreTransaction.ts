import { Disposable } from '@most/types'

export interface IndexedDbStoreTransation extends Disposable {
  readonly transaction: IDBTransaction
  readonly store: IDBObjectStore
}
