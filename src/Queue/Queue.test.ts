import { deepStrictEqual, ok } from 'assert'

import { Completed, Suspended } from '@/Fiber'
import { forkAll, Fx, runMain, suspend, tuple } from '@/Fx'

import * as Queue from './make'

describe(__filename, () => {
  describe(Queue.make.name, () => {
    describe('Unbounded', () => {
      it('allows enqueing any number of values into the queue', async () => {
        const queue = Queue.unbounded<number>()
        const items = [1, 2, 3, 4] as const

        const test = Fx(function* () {
          // Returns true because all items are queueable
          ok(yield* queue.enqueue(...items))
          deepStrictEqual(yield* queue.dequeueAll, items)
        })

        await runMain(test)
      })
    })

    describe('Dropping', () => {
      it('drops new events after reaching capacity', async () => {
        const queue = Queue.dropping<number>(2)
        const items = [1, 2, 3, 4] as const

        const test = Fx(function* () {
          // Returns false because not all items are queueable
          ok(!(yield* queue.enqueue(...items)))

          deepStrictEqual(yield* queue.dequeueAll, [1, 2])
        })

        await runMain(test)
      })
    })

    describe('Sliding', () => {
      it('drops old events after reaching capacity', async () => {
        const queue = Queue.sliding<number>(2)
        const items = [1, 2, 3, 4] as const

        const test = Fx(function* () {
          // Returns false because not all items are queueable
          ok(!(yield* queue.enqueue(...items)))

          deepStrictEqual(yield* queue.dequeueAll, [3, 4])
        })

        await runMain(test)
      })
    })

    describe('Suspended', () => {
      it('suspends enqueing fibers until there is capacity', async () => {
        const queue = Queue.suspend<number>(2)
        const items = [1, 2, 3, 4] as const

        const test = Fx(function* () {
          const fibers = yield* forkAll(items.map((i) => queue.enqueue(i)))

          const getStatuses = () => tuple(fibers.map((f) => f.status))

          deepStrictEqual(yield* getStatuses(), [
            Suspended(() => true),
            Suspended(() => true),
            Suspended(() => true),
            Suspended(() => true),
          ])

          // Allow the fibers to start processing
          yield* suspend()

          deepStrictEqual(yield* getStatuses(), [
            Completed,
            Completed,
            Suspended(() => true),
            Suspended(() => true),
          ])

          deepStrictEqual(yield* queue.dequeue, 1)

          deepStrictEqual(yield* getStatuses(), [
            Completed,
            Completed,
            Completed,
            Suspended(() => true),
          ])

          deepStrictEqual(yield* queue.dequeue, 2)

          deepStrictEqual(yield* getStatuses(), [Completed, Completed, Completed, Completed])

          deepStrictEqual(yield* queue.dequeueAll, [3, 4])
        })

        await runMain(test)
      })
    })
  })
})
