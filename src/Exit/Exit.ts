import { Either } from 'fp-ts/Either'

import { Cause } from '@/Cause'

export type Exit<A> = Either<Cause, A>
