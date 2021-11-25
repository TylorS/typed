import { Either } from 'fp-ts/Either'

import { Async } from '@/Async'

export interface AsyncEither<E, A> extends Async<Either<E, A>> {}
