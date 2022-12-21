import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

import { GlobalThis, getGlobalThis } from './GlobalThis.js'

export const makeMutationObserver = (
  node: Node,
  options?: MutationObserverInit,
): Fx.Fx<GlobalThis, never, readonly MutationRecord[]> =>
  Fx.fromEmitter((emitter) =>
    Effect.gen(function* ($) {
      const globalThis = yield* $(getGlobalThis)

      const observer = new globalThis.MutationObserver(emitter.emit)

      observer.observe(node, options)

      yield* $(Effect.addFinalizer(() => Effect.sync(() => observer.disconnect())))
    }),
  )
