import { proxyStorage } from './proxyStorage'

// Allows creating namespaces within Storage
export function scopeStorage(scope: string, storage: Storage): Storage {
  return proxyStorage(createScopedStorage(scope, storage))
}

function createScopedStorage(scope: string, storage: Storage): Storage {
  let scopedKeys = getAllKeysInScope(scope, storage)

  const getScopedKey = (key: string) => `${scope}-${key}`
  const getItem = (key: string) => storage.getItem(getScopedKey(key))
  const setItem = (key: string, value: string) => {
    const scopedKey = getScopedKey(key)

    if (scopedKeys.indexOf(scopedKey) === -1) {
      scopedKeys.push(scopedKey)
    }

    return storage.setItem(scopedKey, value)
  }
  const removeItem = (key: string) => {
    const scopedKey = getScopedKey(key)
    const index = scopedKeys.indexOf(scopedKey)

    if (index > -1) {
      scopedKeys.splice(index)
    }

    return storage.removeItem(scopedKey)
  }
  const clear = () => {
    scopedKeys.forEach((key) => storage.removeItem(key))
    scopedKeys = []
  }
  const key = (i: number) => scopedKeys[i]

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    get length() {
      return scopedKeys.length
    },
    key,
  }
}

function getAllKeysInScope(scope: string, storage: Storage): string[] {
  const scopedKeys: string[] = []

  for (let i = 0; i < storage.length; ++i) {
    const key = localStorage.key(i)!

    if (key.indexOf(scope) === 0) {
      scopedKeys.push(key)
    }
  }

  return scopedKeys
}
