import { Resume } from '@typed/fp/Resume'
import { Either } from 'fp-ts/Either'

export type ResumeEither<E, A> = Resume<Either<E, A>>
