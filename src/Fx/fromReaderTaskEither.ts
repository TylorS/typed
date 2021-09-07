import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'

import { ReaderTaskEitherInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import { Fx } from './Fx'

export function fromReaderTaskEither<R, E, A>(
  readerTaskEither: ReaderTaskEither<R, E, A>,
): Fx<R, E, A> {
  return fromInstruction(new ReaderTaskEitherInstruction(readerTaskEither))
}
