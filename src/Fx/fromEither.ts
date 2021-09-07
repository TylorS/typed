import * as Either from 'fp-ts/Either'
import { flow } from 'fp-ts/function'

import { EitherInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import { EFx } from './Fx'

export function fromEither<E, A>(either: Either.Either<E, A>): EFx<E, A> {
  return fromInstruction(new EitherInstruction(either))
}

export const of = flow(Either.right, fromEither)

export const left = flow(Either.left, fromEither)
