import { Either } from 'fp-ts/Either'

import { Cause } from '@/Cause'

export type Exit<E, A> = Either<Cause<E>, A>
