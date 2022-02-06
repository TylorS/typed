import { Fiber } from '@/Fiber'
import * as Fx from '@/Fx'
import { isSome, None, Option, Some } from '@/Option'
import * as Ref from '@/Ref'

import { Layer, LayerId } from './Layer'

export const GlobalLayers = Ref.global(
  Fx.fromIO(() => new Map<LayerId, Fiber<any, any>>(), 'CreateLayers'),
)

export const LocalLayers = Ref.make(
  Fx.fromIO(() => new Map<LayerId, Fiber<any, any>>(), 'CreateLayers'),
)

export function getLayers<R, E, A>(layer: Layer<R, E, A>) {
  return (layer.global ? GlobalLayers : LocalLayers).get
}

export function find<R, E, A>(layer: Layer<R, E, A>): Fx.Fx<unknown, E, Option<A>> {
  return Fx.Fx(function* () {
    const layers = yield* getLayers(layer)

    if (layers.has(layer.id)) {
      const fiber = layers.get(layer.id) as Fiber<E, A>
      const exit = yield* fiber.exit

      return Some(yield* Fx.fromExit(exit))
    }

    return None
  })
}

/**
 * Get the currently memoized Service implementation for a given Layer, otherwise
 * Construct a
 */
export function get<R, E, A>(layer: Layer<R, E, A>): Fx.Fx<R, E, A> {
  const { id } = layer

  return Fx.Fx(function* () {
    const current = yield* find(layer)

    if (isSome(current)) {
      return current.value
    }

    const layers = yield* getLayers(layer)
    const fiber = yield* Fx.fork(layer.provider)

    layers.set(id, fiber)

    return yield* Fx.join(fiber)
  })
}

/**
 * Update a Service with a newer implementation. If it does not yet exist, it will be
 * created first to apply your function against. If the Layer is marked to not be overridable
 * Option.None will be returned, otherwise Option.Some will be returned containing the updated Service.
 */
export function update<S, R2, E2>(f: (service: S) => Fx.Fx<R2, E2, S>) {
  return <R, E>(layer: Layer<R, E, S>): Fx.Fx<R2 & R, E | E2, Option<S>> =>
    Fx.Fx(function* () {
      if (!layer.overridable) {
        return None
      }

      const current = yield* get(layer)
      const fiber = yield* Fx.fork(f(current))

      yield* (layer.global ? GlobalLayers : LocalLayers).update((m) =>
        Fx.fromIO(() => m.set(layer.id, fiber)),
      )

      return Some(yield* Fx.join(fiber))
    })
}

export function remove<R, E, A>(layer: Layer<R, E, A>): Fx.Of<boolean> {
  return Fx.Fx(function* () {
    if (!layer.overridable) {
      return false
    }

    const layers = yield* (layer.global ? GlobalLayers : LocalLayers).get

    if (layers.has(layer.id)) {
      const fiber = layers.get(layer.id)!

      layers.delete(layer.id)

      yield* Fx.dispose(fiber)

      return true
    }

    return false
  })
}

export { remove as delete }

export function refresh<R, E, A>(layer: Layer<R, E, A>): Fx.Fx<R, E, Option<A>> {
  return Fx.Fx(function* () {
    if (yield* remove(layer)) {
      return Some(yield* get(layer))
    }

    return None
  })
}
