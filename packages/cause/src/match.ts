import {
  Cause,
  Concurrent,
  Empty,
  Expected,
  Interrupted,
  Sequential,
  Traced,
  Unexpected,
} from './Cause.js'

export function match<E, R1, R2, R3, R4, R5, R6, R7>(matchers: {
  readonly Empty: (cause: Empty) => R1
  readonly Interrupted: (interrupted: Interrupted) => R2
  readonly Unexpected: (unexpected: Unexpected) => R3
  readonly Expected: (expected: Expected<E>) => R4
  readonly Sequential: (sequential: Sequential<E>) => R5
  readonly Concurrent: (concurrent: Concurrent<E>) => R6
  readonly Traced: (traced: Traced<E>) => R7
}) {
  return (cause: Cause<E>): R1 | R2 | R3 | R4 | R5 | R6 | R7 =>
    (matchers[cause.tag] as (c: typeof cause) => R1 | R2 | R3 | R4 | R5 | R6 | R7)(cause)
}
