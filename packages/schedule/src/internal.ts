import { monoid, semigroup } from '@fp-ts/core'
import * as Duration from '@fp-ts/data/Duration'
import * as N from '@fp-ts/data/Number'
import * as O from '@fp-ts/data/Option'

const toFromDuration = semigroup.imap(Duration.millis, (d) => d.millis)

export const maxTimeSemigroup = semigroup.max(N.Order)
export const maxTimeOptionMonoid: monoid.Monoid<O.Option<number>> = O.getMonoid(maxTimeSemigroup)

export const maxDurationSemigroup = toFromDuration(maxTimeSemigroup)
export const maxDurationOptionMonoid = O.getMonoid(maxDurationSemigroup)

export const minTimeSemigroup = semigroup.min(N.Order)
export const minTimeOptionMonoid = O.getMonoid(minTimeSemigroup)

export const minDurationSemigroup = toFromDuration(minTimeSemigroup)
export const minDurationOptionMonoid = O.getMonoid(minDurationSemigroup)
