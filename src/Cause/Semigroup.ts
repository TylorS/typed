import * as Semigroup from 'fp-ts/Semigroup'

import { Both, Cause, Then } from './Cause'

export const SemigroupBoth: Semigroup.Semigroup<Cause> = {
  concat: (second) => (first) => Both(first, second),
}

export const appendBoth = Semigroup.concatAll(SemigroupBoth)

export const SemigroupThen: Semigroup.Semigroup<Cause> = {
  concat: (second) => (first) => Then(first, second),
}

export const appendThen = Semigroup.concatAll(SemigroupThen)
