import { Tag } from '@fp-ts/data/Context'

import * as Effect from './Effect/Effect.js'
import type { RuntimeFiber } from './Fiber.js'
import { FiberId, None } from './FiberId.js'
import { zipAll } from './operators.js'

export interface FiberScope {
  readonly id: FiberId
  readonly size: number
  readonly addChild: <E1, A1>(child: RuntimeFiber<E1, A1>) => void
  readonly interruptChildren: Effect.Effect<never, never, void>
}

export function FiberScope(id: FiberId): FiberScope {
  const children = new Set<RuntimeFiber<any, any>>()

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
    interruptChildren: Effect.lazy(() =>
      Effect.map(() => children.clear())(
        zipAll(Array.from(children).map((c) => c.interruptAs(id))),
      ),
    ),
  }

  return scope
}

export type GlobalFiberScope = FiberScope & GLOBAL_FIBER_SCOPE

export const GlobalFiberScope = Object.assign(function makeGlobalFiberScope(): GlobalFiberScope {
  return FiberScope(None) as GlobalFiberScope
}, Tag<GlobalFiberScope>())

export interface GLOBAL_FIBER_SCOPE {
  readonly GLOBAL_FIBER_SCOPE: unique symbol
}
