import { fromExit } from '@/Effect/FromExit'
import { Fx } from '@/Fx'

import { currentRuntime } from './Runtime'

/**
 * Configures how many synchronous instructions that may run before yielding
 * to other running Fibers.
 */
export const withMaxOps =
  (maxOps: number) =>
  <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> =>
    Fx(function* () {
      const runtime = yield* currentRuntime<R>({ maxOps })
      const fiber = runtime.runFiber(fx)
      const exit = yield* fiber.exit

      // TODO: Inherit Refs

      return yield* fromExit(exit)
    })
