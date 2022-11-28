import { Tag } from '@fp-ts/data/Context'

import { Effect } from '../effect/Effect.js'
import { LiveFiber } from '../fiber/Fiber.js'
import { FiberId, None } from '../fiber/FiberId.js'

export interface FiberScope {
  readonly id: FiberId
  readonly size: number
  readonly addChild: <E1, A1>(child: LiveFiber<E1, A1>) => void
  readonly interruptChildren: Effect.Of<void>
}

export function FiberScope(id: FiberId): FiberScope {
  const children = new Set<LiveFiber<any, any>>()

  const scope: FiberScope = {
    id,
    get size() {
      return children.size
    },
    addChild: (child) => {
      children.add(child)

      child.addObserver(() => {
        children.delete(child)
      })
    },
    interruptChildren: Effect(function* () {
      // TODO: Concurrency
      for (const child of children) {
        yield* child.interruptAs(None)
      }

      children.clear()
    }),
  }

  return scope
}

export type GlobalFiberScope = FiberScope & GLOBAL_FIBER_SCOPE

export const GlobalFiberScope = Tag<GlobalFiberScope>()

export function makeGlobalFiberScope(): GlobalFiberScope {
  return FiberScope(None) as GlobalFiberScope
}

export interface GLOBAL_FIBER_SCOPE {
  readonly GLOBAL_FIBER_SCOPE: unique symbol
}
