import { IndexedDbStoreTransation } from './IndexedDbStoreTransaction'

/**
 * Create a read transaction
 */
export const createReadTransaction = (database: IDBDatabase): IndexedDbStoreTransation => {
  const transaction = database.transaction(database.name, 'readonly')
  const store = transaction.objectStore(database.name)
  const dispose = () => transaction.abort()

  return { transaction, store, dispose } as const
}
