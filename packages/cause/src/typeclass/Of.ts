import { Kind, TypeLambda } from '@fp-ts/core/HKT'
import * as O from '@fp-ts/core/typeclass/Of'

import { Cause, Expected } from '../Cause.js'

import { CauseTypeLambda } from './TypeLambda.js'

export const Of: O.Of<CauseTypeLambda> = {
  of: Expected,
}

export const Do = O.Do(Of)

export const unit = O.unit(Of)

export const ofComposition: <T extends TypeLambda>(
  other: O.Of<T>,
) => <A>(a: A) => Kind<T, unknown, never, never, Cause<A>> = <T extends TypeLambda>(
  other: O.Of<T>,
) => O.ofComposition(other, Of)

export const ofCompositionFlipped: <T extends TypeLambda>(
  other: O.Of<T>,
) => <A>(a: A) => Cause<Kind<T, unknown, never, never, A>> = <T extends TypeLambda>(
  other: O.Of<T>,
) => O.ofComposition(Of, other)
