import { IO } from 'fp-ts/IO'

import { Exit } from '@/Exit'

import { FiberDescriptor } from './FiberDescriptor'
import { FiberId } from './FiberId'

export interface Fiber<R, E, A> {
  /**
   * Unique references for a Fiber
   */
  readonly id: FiberId

  /**
   * Get the current fiber descriptor
   */
  readonly descriptor: IO<FiberDescriptor<R, E, A>>

  /**
   * Await for the Exit of this fiber
   */
  readonly await: Promise<Exit<E, A>>

  /**
   * Interrupt this Fiber
   */
  readonly interruptAs: (id: FiberId) => Promise<Exit<E, A>>
}
