import { IndexedDbStoreTransation } from './IndexedDbStoreTransaction'

export const createWriteTransaction = (database: IDBDatabase): IndexedDbStoreTransation => {
  const transaction = database.transaction(database.name, 'readwrite')
  const store = transaction.objectStore(database.name)
  const dispose = () => transaction.abort()

  return { transaction, store, dispose } as const
}
