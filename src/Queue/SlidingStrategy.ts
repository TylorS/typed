import { fromLazy } from '@/Fx'

import { QueueStrategy } from './QueueStrategy'

/**
 * Creates a QueueStrategy which always favors the offered values
 * and drops the oldest values in the Queue to stay at capacity.
 */
export function makeSlidingStategy<A>(capacity: number): QueueStrategy<A> {
  return {
    capacity,
    offer: (offered, queue) =>
      fromLazy(() => {
        const size = queue.length
        const proposedSize = size + offered.length
        const canHandleSurplus = proposedSize <= capacity

        // Remove any additional
        if (queue.length > 0 && !canHandleSurplus) {
          queue.splice(0, proposedSize - capacity)
        }

        queue.push(...offered.slice(capacity - queue.length, offered.length))

        return offered.length <= capacity
      }),
  }
}
