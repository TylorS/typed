import { Layer } from './Layer'

/**
 * Utilize a WeakMap to weakly keep track of a Layer's ID
 */
const memoizedIds = new WeakMap<Layer<any, any, any>, string>()

export const idOf = <R, E, A>(layer: Layer<R, E, A>): string => {
  if (memoizedIds.has(layer)) {
    return memoizedIds.get(layer)!
  }

  const id = getId(layer)

  memoizedIds.set(layer, id)

  return id
}

const getId = <R, E, A>(layer: Layer<R, E, A>): string => {
  if (typeof layer.id === 'symbol') {
    const key = Symbol.keyFor(layer.id)

    return key === undefined ? layer.id.description ?? 'LayerId' : key
  }

  return `${layer.id}`
}
