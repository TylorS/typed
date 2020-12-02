/**
 * Proxy a Storage interface to allow indexing functionality around an otherwise
 * valid Storage interface.
 */
export function proxyStorage(storage: Storage): Storage {
  return new Proxy(storage, { get, set })
}

function get(target: Storage, property: keyof Storage) {
  if (target[property]) {
    return target[property]
  }

  if (typeof property === 'number') {
    return getByIndex(property, target)
  }

  return target.getItem(property)
}

function getByIndex(index: number, storage: Storage) {
  const key = storage.key(index)

  return key ? storage.getItem(key) : null
}

function set(target: Storage, property: keyof Storage, value: string) {
  const key = typeof property === 'number' ? target.key(property) : property

  if (!key) {
    return false
  }

  target.setItem(key, value)

  return true
}
