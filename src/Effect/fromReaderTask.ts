import { pipe } from 'fp-ts/function'
import { ReaderTask } from 'fp-ts/ReaderTask'

import { chain } from './chain'
import { Effect } from './Effect'
import { fromReader } from './fromReader'
import { fromTask } from './fromTask'

/**
 * Convert a ReaderTask<E, A> into an Effect<E, A>
 */
export function fromReaderTask<E, A>(rte: ReaderTask<E, A>): Effect<E, A> {
  return pipe(rte, fromReader, chain(fromTask))
}
