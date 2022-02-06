import { FiberId } from '@/FiberId'
import { pipe } from '@/function'
import * as O from '@/Option'
import { Trace } from '@/Trace/Trace'

/**
 * Union type to represent the ways in which a Fiber can exit unsuccessfully.
 */
export type Cause<E> = Expected<E> | Unexpected | Disposed | Both<E> | Then<E> | Traced<E>

/**
 * An unexpected Error is one that has been thown using the `throw` keyword
 * and was not caught by any other code.
 */
export interface Expected<E> {
  readonly type: 'Expected'
  readonly error: E
}

/**
 * Constructs an Unexpected Instance
 */
export const Expected = <E>(error: E): Expected<E> => ({ type: 'Expected', error })

/**
 * An unexpected Error is one that has been thown using the `throw` keyword
 * and was not caught by any other code.
 */
export interface Unexpected {
  readonly type: 'Unexpected'
  readonly error: unknown
}

/**
 * Constructs an Unexpected Instance
 */
export const Unexpected = (error: unknown): Unexpected => ({ type: 'Unexpected', error })

/**
 * Abstraction to represent a Fiber has been disposed of.
 */
export interface Disposed {
  readonly type: 'Disposed'
  readonly fiberId: FiberId
}

/**
 * A singleton instance of Disposed
 */
export const Disposed = (fiberId: FiberId): Disposed => ({
  type: 'Disposed',
  fiberId,
})

export interface Both<E> {
  readonly type: 'Both'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export const Both = <L, R>(left: Cause<L>, right: Cause<R>): Both<L | R> => ({
  type: 'Both',
  left,
  right,
})

export interface Then<E> {
  readonly type: 'Then'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export const Then = <L, R>(left: Cause<L>, right: Cause<R>): Then<L | R> => ({
  type: 'Then',
  left,
  right,
})

export interface Traced<E> {
  readonly type: 'Traced'
  readonly trace: Trace
  readonly cause: Cause<E>
}

export const Traced = <E>(trace: Trace, cause: Cause<E>): Traced<E> => ({
  type: 'Traced',
  trace,
  cause,
})

export const addParentTrace =
  (trace: O.Option<Trace>) =>
  <E>(cause: Cause<E>): Cause<E> =>
    pipe(
      trace,
      O.match(
        () => cause,
        (t) => Traced(t, cause),
      ),
    )

/**
 * Pattern match over a Cause
 */
export function match<E, A, B, C, D, F, G>(
  onExpected: (error: E) => A,
  onUnexpected: (error: unknown) => B,
  onDisposed: () => C,
  onBoth: (left: Cause<E>, right: Cause<E>) => D,
  onThen: (left: Cause<E>, right: Cause<E>) => F,
  onTraced: (trace: Trace, cause: Cause<E>) => G,
) {
  return (cause: Cause<E>): A | B | C | D | F | G => {
    switch (cause.type) {
      case 'Expected':
        return onExpected(cause.error)
      case 'Unexpected':
        return onUnexpected(cause.error)
      case 'Disposed':
        return onDisposed()
      case 'Both':
        return onBoth(cause.left, cause.right)
      case 'Then':
        return onThen(cause.left, cause.right)
      case 'Traced':
        return onTraced(cause.trace, cause.cause)
      default:
        throw new Error(`Unexpcted Cause ${JSON.stringify(cause, null, 2)}`)
    }
  }
}

/**
 * Type-guard for determining if an error is a Cause
 */
export function isCause(error: unknown): error is Cause<unknown> {
  return (
    isExpected(error) || isUnexpected(error) || isDisposed(error) || isThen(error) || isBoth(error)
  )
}

/**
 * Type-guard for determining if an error is an Unexpected Cause
 */
export function isExpected<E, A>(error: Cause<E>): error is Expected<E>
export function isExpected(error: unknown): error is Expected<unknown>
export function isExpected(error: unknown): error is Expected<unknown> {
  return isObject(error) && error?.type === 'Expected'
}

/**
 * Type-guard for determining if an error is an Unexpected Cause
 */
export function isUnexpected<E>(error: Cause<E>): error is Unexpected
export function isUnexpected(error: unknown): error is Unexpected
export function isUnexpected(error: unknown): error is Unexpected {
  return isObject(error) && error?.type === 'Unexpected'
}

/**
 * Type-guard for determining if an error is an Disposed Cause
 */
export function isDisposed<E>(error: Cause<E>): error is Disposed
export function isDisposed(error: unknown): error is Disposed
export function isDisposed(error: unknown): error is Disposed {
  return isObject(error) && error?.type === 'Disposed'
}

/**
 * Type-guard for determining if an error is an Then Cause
 */
export function isThen<E>(error: Cause<E>): error is Then<E>
export function isThen(error: unknown): error is Then<unknown>
export function isThen(error: unknown): error is Then<unknown> {
  return isObject(error) && error?.type === 'Then'
}

/**
 * Type-guard for determining if an error is an Both Cause
 */
export function isBoth<E>(error: Cause<E>): error is Both<E>
export function isBoth(error: unknown): error is Both<unknown>
export function isBoth(error: unknown): error is Both<unknown> {
  return isObject(error) && error?.type === 'Both'
}

function isObject(error: unknown): error is Record<string, unknown> {
  return typeof error === 'object' && !(error == null)
}
