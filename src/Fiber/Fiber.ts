import { Context } from '@/Context'
import { Disposable } from '@/Disposable'
import { Exit } from '@/Exit'
import { Of } from '@/Fx'
import { MutableRef } from '@/MutableRef'
import { LocalScope } from '@/Scope'

import { FiberId } from './FiberId'

export type Fiber<A> = RuntimeFiber<A> | SyntheticFiber<A>

export interface RuntimeFiber<A> extends Disposable {
  readonly type: 'Runtime'

  /**
   * The unique identifier of this specific fiber.
   */
  readonly id: FiberId

  /**
   * The scope in which the Fiber is running within
   */
  readonly scope: LocalScope<unknown, A>

  /**
   * The current status of the Fiber
   */
  readonly status: MutableRef<Status>
  /**
   * The context in which the Fiber's instructions are running within
   */
  readonly context: Context
  /**
   * Wait for the Exit of this current Fiber
   */
  readonly exit: Of<Exit<A>>
}

export interface SyntheticFiber<A> extends Disposable {
  readonly type: 'Synthetic'

  /**
   * The current status of the Fiber
   */
  readonly status: MutableRef<Status>

  /**
   * The context in which the Fiber's instructions are running within
   */
  readonly context: Context

  /**
   * Wait for the Exit of this current Fiber
   */
  readonly exit: Of<Exit<A>>
}

export type Status = Suspended | Running | Failed | Completed

export interface Suspended {
  readonly type: 'Suspended'
}

export interface Running {
  readonly type: 'Running'
}

export interface Failed {
  readonly type: 'Failed'
}

export interface Completed {
  readonly type: 'Completed'
}
