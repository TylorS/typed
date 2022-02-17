import * as Semigroup from '@/Prelude/Semigroup'

import { Both, Cause, Then } from './Cause'

export const SemigroupBoth: Semigroup.Semigroup<Cause<unknown>> = {
  concat: (second: Cause<unknown>) => (first: Cause<unknown>) => Both(first, second),
}

export const getSemigroupBoth = <E>() => SemigroupBoth as Semigroup.Semigroup<Cause<E>>

export const appendBoth = Semigroup.concatAll(SemigroupBoth) as <E>(
  startWith: Cause<E>,
) => (as: readonly Cause<E>[]) => Cause<E>

export const SemigroupThen: Semigroup.Semigroup<Cause<unknown>> = {
  concat: (second) => (first) => Then(first, second),
}

export const getSemigroupThen = <E>() => SemigroupThen as Semigroup.Semigroup<Cause<E>>

export const appendThen = Semigroup.concatAll(SemigroupThen) as <E>(
  startWith: Cause<E>,
) => (as: readonly Cause<E>[]) => Cause<E>
