import * as Associative from '@/Prelude/Associative'

import { Both, Cause, Then } from './Cause'

export const AssociativeBoth: Associative.Associative<Cause<unknown>> = {
  associative: (second: Cause<unknown>) => (first: Cause<unknown>) => Both(first, second),
}

export const getAssociativeBoth = <E>() => AssociativeBoth as Associative.Associative<Cause<E>>

export const appendBoth = Associative.concatAll(AssociativeBoth) as <E>(
  startWith: Cause<E>,
) => (as: readonly Cause<E>[]) => Cause<E>

export const AssociativeThen: Associative.Associative<Cause<unknown>> = {
  associative: (second) => (first) => Then(first, second),
}

export const getAssociativeThen = <E>() => AssociativeThen as Associative.Associative<Cause<E>>

export const appendThen = Associative.concatAll(AssociativeThen) as <E>(
  startWith: Cause<E>,
) => (as: readonly Cause<E>[]) => Cause<E>
