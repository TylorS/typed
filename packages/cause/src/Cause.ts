import { Equal, hashRandom } from '@fp-ts/data/Equal'
import { memoHash, hashAll } from '@typed/internal'
import { UnixTime } from '@typed/time'
import { Trace } from '@typed/trace'

export type Cause<E> =
  | Empty
  | Interrupted
  | Unexpected
  | Expected<E>
  | Sequential<E>
  | Concurrent<E>
  | Traced<E>

export namespace Cause {
  export type Simple<E> = Empty | Interrupted | Unexpected | Expected<E>
}

export interface Empty extends Equal {
  readonly _tag: 'Empty'
}

export interface Interrupted extends Equal {
  readonly _tag: 'Interrupted'
  readonly time: UnixTime
  readonly by: string
}

export interface Unexpected extends Equal {
  readonly _tag: 'Unexpected'
  readonly time: UnixTime
  readonly error: unknown
}

export interface Expected<E> extends Equal {
  readonly _tag: 'Expected'
  readonly time: UnixTime
  readonly error: E
}

export interface Sequential<E> extends Equal {
  readonly _tag: 'Sequential'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export interface Concurrent<E> extends Equal {
  readonly _tag: 'Concurrent'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export interface Traced<E> extends Equal {
  readonly _tag: 'Traced'
  readonly cause: Cause<E>
  readonly execution: Trace
  readonly stack: Trace
}

export const Empty: Empty & Cause<never> = { _tag: 'Empty', ...memoHash(() => hashRandom(Empty)) }

export const isEmpty = <E>(cause: Cause<E>): cause is Empty => cause._tag === 'Empty'

export const Interrupted = (time: UnixTime, by: string): Interrupted & Cause<never> => ({
  _tag: 'Interrupted',
  time,
  by,
  ...memoHash(() => hashAll('Interrupted', time, by)),
})

export const isInterrupted = <E>(cause: Cause<E>): cause is Interrupted =>
  cause._tag === 'Interrupted'

export const Unexpected = (time: UnixTime, error: unknown): Unexpected & Cause<never> => ({
  _tag: 'Unexpected',
  time,
  error,
  ...memoHash(() => hashAll('Unexpected', time, error)),
})

export const isUnexpected = <E>(cause: Cause<E>): cause is Unexpected => cause._tag === 'Unexpected'

export const Expected = <E>(time: UnixTime, error: E): Expected<E> => ({
  _tag: 'Expected',
  time,
  error,
  ...memoHash(() => hashAll('Expected', time, error)),
})

export const isExpected = <E>(cause: Cause<E>): cause is Expected<E> => cause._tag === 'Expected'

export const Sequential = <E = never, E2 = never>(
  left: Cause<E>,
  right: Cause<E2>,
): Cause<E | E2> =>
  left._tag === 'Empty'
    ? right
    : right._tag === 'Empty'
    ? left
    : {
        _tag: 'Sequential',
        left,
        right,
        ...memoHash(() => hashAll('Sequential', left, right)),
      }

export const isSequential = <E>(cause: Cause<E>): cause is Sequential<E> =>
  cause._tag === 'Sequential'

export const Concurrent = <E = never, E2 = never>(
  left: Cause<E>,
  right: Cause<E2>,
): Cause<E | E2> =>
  left._tag === 'Empty'
    ? right
    : right._tag === 'Empty'
    ? left
    : {
        _tag: 'Concurrent',
        left,
        right,
        ...memoHash(() => hashAll('Concurrent', left, right)),
      }

export const isConcurrent = <E>(cause: Cause<E>): cause is Concurrent<E> =>
  cause._tag === 'Concurrent'

export const Traced = <E>(cause: Cause<E>, execution: Trace, stack: Trace): Traced<E> => ({
  _tag: 'Traced',
  cause,
  execution,
  stack,
  ...memoHash(() => hashAll('Traced', cause, execution, stack)),
})

export const isTraced = <E>(cause: Cause<E>): cause is Traced<E> => cause._tag === 'Traced'
