import { fromIO } from '@/Fx'

import { QueueStrategy } from './QueueStrategy'

/**
 * Creates a QueueStrategy which always favors the values currently in the Queue
 * and drops any that come in after capacity has been hit.
 */
export function makeDroppingStategy<A>(capacity: number): QueueStrategy<A> {
  return {
    capacity,
    offer: (offered, queue) =>
      fromIO(() => {
        const proposedSize = queue.length + offered.length
        const canHandleSurplus = proposedSize <= capacity

        if (canHandleSurplus) {
          queue.push(...offered)

          return true
        }

        // Drop any values that can not fit
        const toRemove = proposedSize - capacity
        const toKeep = offered.length - toRemove

        if (toKeep > 0) {
          queue.push(...offered.slice(0, toKeep))
        }

        return false
      }),
  }
}
