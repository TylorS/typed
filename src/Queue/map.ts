import * as Fx from '@/Fx'
import { flow, pipe } from '@/Prelude/function'
import * as O from '@/Prelude/Option'
import * as RA from '@/Prelude/ReadonlyArray'

import { Dequeue, Queue } from './Queue'

export function map<A, B>(f: (a: A) => B) {
  function mapQueue<R, E, I, R2, E2>(queue: Queue<R, E, I, R2, E2, A>): Queue<R, E, I, R2, E2, B>
  function mapQueue<R, E>(queue: Dequeue<R, E, A>): Dequeue<R, E, B>
  function mapQueue<R, E>(queue: Dequeue<R, E, A>): Dequeue<R, E, B> {
    return {
      ...queue,
      poll: pipe(queue.poll, Fx.map(O.map(f))),
      dequeue: pipe(queue.dequeue, Fx.map(f)),
      dequeueAll: pipe(queue.dequeueAll, Fx.map(RA.map(f))),
      dequeueUpTo: flow(queue.dequeueUpTo, Fx.map(RA.map(f))),
    }
  }

  return mapQueue
}
