import { Both } from '../Both'
import { Either } from '../Either'

export type These<E, A> = Either<E, A> | Both<E, A>
