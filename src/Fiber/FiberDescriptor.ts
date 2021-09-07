import { FiberId } from './FiberId'
import { FiberStatus } from './FiberStatus'
import { Scope } from './Scope'

export interface FiberDescriptor<R, E, A> {
  readonly id: FiberId
  readonly scope: Scope<R>
  readonly status: FiberStatus<E, A>
  readonly isInterruptible: boolean
}
