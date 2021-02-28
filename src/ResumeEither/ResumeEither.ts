import { Resume } from '@typed/fp/Resume'
import { Either } from 'fp-ts/dist/Either'

export type ResumeEither<E, A> = Resume<Either<E, A>>
