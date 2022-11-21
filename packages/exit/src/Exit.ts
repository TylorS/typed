import { Either } from '@fp-ts/data/Either'
import { Cause } from '@typed/cause'

export type Exit<E, A> = Either<Cause<E>, A>
