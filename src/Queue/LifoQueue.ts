import { createFifoQueue } from './FifoQueue'
import { Queue } from './Queue'

export function createLifoQueue<A>(queue: Array<A>): Queue<A> {
  const fifo = createFifoQueue(queue)

  return {
    ...fifo,
    enqueue: (value) => queue.unshift(value),
  }
}
