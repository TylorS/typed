import { right } from 'fp-ts/Either'
import { flow } from 'fp-ts/function'
import { IO, map as mapIO } from 'fp-ts/IO'
import { IOEither } from 'fp-ts/IOEither'

import { IOEitherInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import { EFx, Pure } from './Fx'

export function fromIOEither<E, A>(ioEither: IOEither<E, A>): EFx<E, A> {
  return fromInstruction(new IOEitherInstruction(ioEither))
}

export const fromIO: <A>(IO: IO<A>) => Pure<A> = flow(mapIO(right), fromIOEither)
