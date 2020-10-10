import { IO } from 'fp-ts/IO'
import { Option } from 'fp-ts/Option'

export interface Queue<A> {
  readonly enqueue: (value: A) => void
  readonly dequeue: IO<Option<A>>
  readonly peek: IO<Option<A>>
}
