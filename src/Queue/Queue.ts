import { IO } from 'fp-ts/IO'
import { Option } from 'fp-ts/Option'

/**
 * A synchronous, likely in-memory, representation of a Queue.
 */
export interface Queue<A> {
  readonly enqueue: (value: A) => void
  readonly dequeue: IO<Option<A>>
  readonly dequeueAll: IO<ReadonlyArray<A>>
  readonly peek: IO<Option<A>>
  readonly some: (f: (value: A) => boolean) => boolean
  readonly remove: (f: (value: A) => boolean) => void
}
