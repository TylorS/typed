import { Data } from '../Data'
import { Either } from '../Either'

export type DataEither<E, A> = Data<Either<E, A>>
