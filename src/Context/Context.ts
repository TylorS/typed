import { Cause, defaultRenderer, prettyPrint, Renderer } from '@/Cause'
import { FiberId, makeFiberId } from '@/FiberId'
import { increment, MutableRef } from '@/MutableRef'

export interface Context<E> {
  readonly fiberId: FiberId
  readonly renderer: Renderer<E>
  readonly reportFailure: (cause: Cause<E>) => void
  readonly sequenceNumber: MutableRef<number>
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
