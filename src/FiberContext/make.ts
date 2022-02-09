import { Cause, defaultRenderer, prettyPrint } from '@/Cause'
import { makeFiberId } from '@/FiberId'
import { makeFiberRefLocals } from '@/FiberRef'
import { increment, MutableRef } from '@/MutableRef'
import { None } from '@/Prelude/Option'
import type { Scheduler } from '@/Scheduler/Scheduler'

import { FiberContext } from './FiberContext'

export interface FiberContextOptions<E> extends Partial<FiberContext<E>> {
  readonly scheduler: Scheduler
}

export function make<E>(options: FiberContextOptions<E>): FiberContext<E> {
  const sequenceNumber = options.sequenceNumber ?? MutableRef.make(0)
  const fiberId = options.fiberId ?? makeFiberId(increment(sequenceNumber))
  const renderer = options.renderer ?? defaultRenderer
  const reportFailure =
    options.reportFailure ?? ((cause: Cause<E>) => console.error(prettyPrint(cause, renderer)))
  const scheduler = options.scheduler
  const locals = options.locals ?? makeFiberRefLocals()

  return {
    fiberId,
    renderer,
    reportFailure,
    sequenceNumber,
    scheduler,
    locals,
    parent: options.parent ?? None,
  }
}
