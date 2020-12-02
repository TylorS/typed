import { chain, Resume, sync } from '@typed/fp/Resume/exports'
import { Either, left, right } from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import { fromNullable } from 'fp-ts/Option'

import { KeyValueStorage } from './KeyValueStorage'

/**
 * Wrap session/localStorage into a KeyValueStorage implementation.
 */
export function wrapDomStorage(storage: Storage): KeyValueStorage<string, string> {
  const getItem = (key: string) => fromNullable(storage.getItem(key))

  return {
    getKeys: tryCatch(() => {
      const items: string[] = []

      for (let i = 0; i < storage.length; ++i) {
        const key = storage.key(i)

        if (key !== null) {
          items.push(key)
        }
      }

      return sync(items)
    }),
    getItems: tryCatch(() => {
      const items: string[] = []

      for (let i = 0; i < storage.length; ++i) {
        const key = storage.key(i)

        if (key !== null) {
          items.push(storage.getItem(key)!)
        }
      }

      return sync(items)
    }),
    getItem: tryCatch(flow(getItem, sync)),
    setItem: tryCatch((key, value) => (storage.setItem(key, value), sync(value))),
    removeItem: tryCatch((key) => {
      const item = getItem(key)

      storage.removeItem(key)

      return sync(item)
    }),
    clearItems: tryCatch(() => {
      storage.clear()

      return sync(true)
    }),
  }
}

const tryCatch = <A extends readonly any[], B>(
  f: (...args: A) => Resume<B>,
): ((...args: A) => Resume<Either<Error, B>>) => (...args) => {
  try {
    return chain(flow(right, sync), f(...args))
  } catch (error) {
    return pipe(error, left, sync)
  }
}
