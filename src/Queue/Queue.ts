import { IO } from 'fp-ts/IO'
import { Option } from 'fp-ts/Option'

/**
 * A synchronous, likely in-memory, representation of a Queue.
 */
export interface Queue<A> {
  readonly enqueue: (value: A) => void
  readonly dequeue: IO<Option<A>>
  readonly peek: IO<Option<A>>
}
