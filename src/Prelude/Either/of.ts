import { Right } from '@/Prelude/Right'

import { Either } from './Either'

export const of = <A, E = never>(value: A): Either<E, A> => Right(value)
