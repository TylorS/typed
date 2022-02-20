import { Async } from '../Async'
import { Either } from '../Either'

export type AsyncEither<E, A> = Async<Either<E, A>>
