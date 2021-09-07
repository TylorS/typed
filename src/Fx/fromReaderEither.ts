import { Reader } from 'fp-ts/Reader'
import * as ReaderEither from 'fp-ts/ReaderEither'

import { ReaderEitherInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import { Fx } from './Fx'

export function fromReaderEither<R, E, A>(
  readerEither: ReaderEither.ReaderEither<R, E, A>,
): Fx<R, E, A> {
  const instr = new ReaderEitherInstruction(readerEither)

  return fromInstruction(instr)
}

export function fromReader<R, A>(reader: Reader<R, A>): Fx<R, never, A> {
  return fromReaderEither(ReaderEither.fromReader(reader))
}
