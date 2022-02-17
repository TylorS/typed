import { Left } from '@/Prelude/Left'
import { Right } from '@/Prelude/Right/Right'

export type Either<E, A> = Left<E> | Right<A>

export { Left, Right }

export const isLeft = <E, A>(either: Either<E, A>): either is Left<E> => either.type === 'Left'

export const isRight = <E, A>(either: Either<E, A>): either is Right<A> => either.type === 'Right'
