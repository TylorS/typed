import * as FiberId from '@effect/io/Fiber/Id'

import { Effect } from './Effect.js'
import { Exit } from './Exit.js'

export interface Fiber<E, A> {
  readonly id: FiberId.FiberId
  readonly wait: Effect<never, never, Exit<E, A>>
  readonly interrupt: (id: FiberId.FiberId) => Effect<never, never, Exit<E, A>>
}

export { FiberId as Id }
