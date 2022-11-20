import { Either } from '@fp-ts/data/Either'
import { Cause } from '@typed/fp/cause/index.js'

export type Exit<E, A> = Either<Cause<E>, A>
