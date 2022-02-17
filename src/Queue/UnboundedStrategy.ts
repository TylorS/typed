import { fromLazy } from '@/Fx'

import { QueueStrategy } from './QueueStrategy'

/**
 * Makes a QueueStrategy which has no bounds besides memory of allocated to the process.
 */
export function makeUnboundedStategy<A>(): QueueStrategy<A> {
  return {
    capacity: Infinity,
    offer: (offered, queue) =>
      fromLazy(() => {
        queue.push(...offered)

        return true
      }),
  }
}
