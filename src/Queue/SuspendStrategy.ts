import { wait } from '@/Future'
import { Fx } from '@/Fx'

import { QueueStrategy } from './QueueStrategy'

/**
 * Creates a QueueStrategy which when reaching capacity will wait for room in the Queue
 * before continuing to add them for processing.
 */
export function makeSuspendStrategy<A>(capacity: number): QueueStrategy<A> {
  return {
    capacity,
    offer: (offered, queue, offers) =>
      Fx(function* () {
        const proposedSize = queue.length + offered.length
        const cantHandleSurplus = proposedSize > capacity

        if (!cantHandleSurplus) {
          queue.push(...offered)

          return true
        }

        const toWaitOn = proposedSize - capacity
        const toPush = offered.length - toWaitOn
        const surplus = [...offered]

        if (toPush > 0) {
          queue.push(...surplus.splice(0, toPush))
        }

        // Wait for values to be dequeued before adding the the queue
        for (const future of offers.waitFor(surplus.length)) {
          yield* wait(future)
          queue.push(surplus.shift()!)
        }

        return true
      }),
  }
}
