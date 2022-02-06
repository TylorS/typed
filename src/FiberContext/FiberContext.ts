import { Cause, Renderer } from '@/Cause'
import { FiberId } from '@/FiberId'
import { FiberRefLocals } from '@/FiberRef'
import { MutableRef } from '@/MutableRef'
import { Option } from '@/Option'
import * as Scheduler from '@/Scheduler'

export interface FiberContext<E> {
  readonly fiberId: FiberId
  readonly renderer: Renderer<E>
  readonly reportFailure: (cause: Cause<E>) => void
  readonly sequenceNumber: MutableRef<number>
  readonly scheduler: Scheduler.Scheduler
  readonly locals: FiberRefLocals
  readonly parent: Option<FiberContext<any>>
}
