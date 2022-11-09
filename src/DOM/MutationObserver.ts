import * as Effect from '@effect/core/io/Effect'
import * as Fx from '@typed/fx'

import { GlobalThis, getGlobalThis } from './GlobalThis.js'

export const makeMutationObserver = (
  node: Node,
  options?: MutationObserverInit,
): Fx.Fx<GlobalThis, never, readonly MutationRecord[]> =>
  Fx.fromFxGen(function* ($) {
    const globalThis = yield* $(getGlobalThis)

    return Fx.withEmitter<never, never, readonly MutationRecord[]>((emitter) => {
      const observer = new globalThis.MutationObserver(emitter.unsafeEmit)

      observer.observe(node, options)

      return Effect.sync(() => observer.disconnect())
    })
  })
