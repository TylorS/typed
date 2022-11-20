import { UnixTime } from '@typed/fp/time/index.js'
import { Trace } from '@typed/fp/trace/index.js'

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

export interface Empty {
  readonly tag: 'Empty'
}

export interface Interrupted {
  readonly tag: 'Interrupted'
  readonly time: UnixTime
  readonly by: string
}

export interface Unexpected {
  readonly tag: 'Unexpected'
  readonly time: UnixTime
  readonly error: unknown
}

export interface Expected<E> {
  readonly tag: 'Expected'
  readonly time: UnixTime
  readonly error: E
}

export interface Sequential<E> {
  readonly tag: 'Sequential'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export interface Concurrent<E> {
  readonly tag: 'Concurrent'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export interface Traced<E> {
  readonly tag: 'Traced'
  readonly cause: Cause<E>
  readonly trace: Trace
}

export const Empty: Empty = { tag: 'Empty' }

export const isEmpty = <E>(cause: Cause<E>): cause is Empty => cause.tag === 'Empty'

export const Interrupted = (time: UnixTime, by: string): Interrupted => ({
  tag: 'Interrupted',
  time,
  by,
})

export const isInterrupted = <E>(cause: Cause<E>): cause is Interrupted =>
  cause.tag === 'Interrupted'

export const Unexpected = (time: UnixTime, error: unknown): Unexpected => ({
  tag: 'Unexpected',
  time,
  error,
})

export const isUnexpected = <E>(cause: Cause<E>): cause is Unexpected => cause.tag === 'Unexpected'

export const Expected = <E>(time: UnixTime, error: E): Expected<E> => ({
  tag: 'Expected',
  time,
  error,
})

export const isExpected = <E>(cause: Cause<E>): cause is Expected<E> => cause.tag === 'Expected'

export const Sequential = <E, E2>(left: Cause<E>, right: Cause<E2>): Sequential<E | E2> => ({
  tag: 'Sequential',
  left,
  right,
})

export const isSequential = <E>(cause: Cause<E>): cause is Sequential<E> =>
  cause.tag === 'Sequential'

export const Concurrent = <E, E2>(left: Cause<E>, right: Cause<E2>): Concurrent<E | E2> => ({
  tag: 'Concurrent',
  left,
  right,
})

export const isConcurrent = <E>(cause: Cause<E>): cause is Concurrent<E> =>
  cause.tag === 'Concurrent'

export const Traced = <E>(cause: Cause<E>, trace: Trace): Traced<E> => ({
  tag: 'Traced',
  cause,
  trace,
})

export const isTraced = <E>(cause: Cause<E>): cause is Traced<E> => cause.tag === 'Traced'
