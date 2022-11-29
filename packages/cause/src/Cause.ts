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

  export type OutputOf<T> = T extends Cause<infer E> ? E : never
}

export interface Empty {
  readonly _tag: 'Empty'
}

export interface Interrupted {
  readonly _tag: 'Interrupted'
  readonly by: string
}

export interface Unexpected {
  readonly _tag: 'Unexpected'
  readonly error: unknown
}

export interface Expected<E> {
  readonly _tag: 'Expected'
  readonly error: E
}

export interface Sequential<E> {
  readonly _tag: 'Sequential'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export interface Concurrent<E> {
  readonly _tag: 'Concurrent'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export interface Traced<E> {
  readonly _tag: 'Traced'
  readonly cause: Cause<E>
  readonly execution: Trace
  readonly stack: Trace
  readonly time: UnixTime
}

export const Empty: Empty & Cause<never> = { _tag: 'Empty' }

export const isEmpty = <E>(cause: Cause<E>): cause is Empty => cause._tag === 'Empty'

export const Interrupted = (by: string): Interrupted & Cause<never> => ({
  _tag: 'Interrupted',
  by,
})

export const isInterrupted = <E>(cause: Cause<E>): cause is Interrupted =>
  cause._tag === 'Interrupted'

export const Unexpected = (error: unknown): Unexpected & Cause<never> => ({
  _tag: 'Unexpected',
  error,
})

export const isUnexpected = <E>(cause: Cause<E>): cause is Unexpected => cause._tag === 'Unexpected'

export const Expected = <E>(error: E): Expected<E> => ({
  _tag: 'Expected',
  error,
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
      }

export const isConcurrent = <E>(cause: Cause<E>): cause is Concurrent<E> =>
  cause._tag === 'Concurrent'

export const Traced = <E>(
  cause: Cause<E>,
  execution: Trace,
  stack: Trace,
  time: UnixTime,
): Traced<E> => ({
  _tag: 'Traced',
  cause,
  execution,
  stack,
  time,
})

export const isTraced = <E>(cause: Cause<E>): cause is Traced<E> => cause._tag === 'Traced'
