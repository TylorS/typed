import { UnixTime } from '@typed/time'
import { Trace } from '@typed/trace'

import { Cause } from './Cause.js'

export function match<R1, R2, R3, E, R4, R5, R6, R7>(
  onEmpty: () => R1,
  onInterrupted: (by: string, time: UnixTime) => R2,
  onUnexpected: (error: unknown, time: UnixTime) => R3,
  onExpected: (error: E, time: UnixTime) => R4,
  onSequential: (left: Cause<E>, right: Cause<E>) => R5,
  onConcurrent: (left: Cause<E>, right: Cause<E>) => R6,
  onTraced: (cause: Cause<E>, trace: Trace) => R7,
) {
  return (cause: Cause<E>): R1 | R2 | R3 | R4 | R5 | R6 | R7 => {
    switch (cause.tag) {
      case 'Empty':
        return onEmpty()
      case 'Interrupted':
        return onInterrupted(cause.by, cause.time)
      case 'Unexpected':
        return onUnexpected(cause.error, cause.time)
      case 'Expected':
        return onExpected(cause.error, cause.time)
      case 'Sequential':
        return onSequential(cause.left, cause.right)
      case 'Concurrent':
        return onConcurrent(cause.left, cause.right)
      case 'Traced':
        return onTraced(cause.cause, cause.trace)
    }
  }
}
