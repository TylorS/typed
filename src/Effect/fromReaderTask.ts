import { ReaderTask } from 'fp-ts/es6/ReaderTask'
import { pipe } from 'fp-ts/lib/function'

import { chain } from './chain'
import { Effect } from './Effect'
import { fromReader } from './fromReader'
import { fromTask } from './fromTask'

export function fromReaderTask<E, A>(rte: ReaderTask<E, A>): Effect<E, A> {
  return pipe(rte, fromReader, chain(fromTask))
}
