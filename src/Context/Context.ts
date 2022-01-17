import { Cause, defaultRenderer, prettyPrint, Renderer } from '@/Cause'
import { FiberId, makeFiberId } from '@/FiberId'
import { FiberRefLocals } from '@/FiberRef'
import { increment, MutableRef } from '@/MutableRef'
import { Scheduler } from '@/Scheduler'

export interface Context<E> {
  readonly fiberId: FiberId
  readonly renderer: Renderer<E>
  readonly reportFailure: (cause: Cause<E>) => void
  readonly sequenceNumber: MutableRef<number>
  readonly scheduler: Scheduler
  readonly locals: FiberRefLocals
}

export interface ContextOptions<E> extends Partial<Context<E>> {}

export function make<E>(options: ContextOptions<E> = {}): Context<E> {
  const sequenceNumber = options.sequenceNumber ?? MutableRef.make(0)
  const fiberId = options.fiberId ?? makeFiberId(increment(sequenceNumber))
  const renderer = options.renderer ?? defaultRenderer
  const reportFailure =
    options.reportFailure ?? ((cause: Cause<E>) => console.error(prettyPrint(cause, renderer)))

  return {
    fiberId,
    renderer,
    reportFailure,
    sequenceNumber,
  }
}
