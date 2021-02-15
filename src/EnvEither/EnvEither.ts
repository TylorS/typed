import { Env } from '@fp/Env/Env'
import { Either } from 'fp-ts/Either'

export interface EnvEither<R, E, A> extends Env<R, Either<E, A>> {}
