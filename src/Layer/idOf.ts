import { Layer } from './Layer'

export const idOf = <R, E, A>(layer: Layer<R, E, A>): string => {
  if (typeof layer.id === 'symbol') {
    const key = Symbol.keyFor(layer.id)

    return key === undefined ? layer.id.description ?? 'unknown' : key
  }

  return `${layer.id}`
}
