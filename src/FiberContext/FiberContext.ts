import { FiberId } from '@/FiberId'
import { FiberRefLocals } from '@/FiberRef'
import { Cause, Renderer } from '@/Prelude/Cause'
import { MutableRef } from '@/Prelude/MutableRef'
import { Option } from '@/Prelude/Option'
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
