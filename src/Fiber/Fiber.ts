import { IO } from 'fp-ts/IO'

import { Disposable } from '@/Disposable'
import { Exit } from '@/Exit'

import { FiberDescriptor } from './FiberDescriptor'
import { FiberId } from './FiberId'

export interface Fiber<R, E, A> extends Disposable<Exit<E, A>> {
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
  readonly exit: Promise<Exit<E, A>>
}
