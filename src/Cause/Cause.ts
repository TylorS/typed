/**
 * Union type to represent the ways in which a Fiber can exit unsuccessfully.
 */
export type Cause = Unexpected | Disposed | Both | Then

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
}

/**
 * A singleton instance of Disposed
 */
export const Disposed: Disposed = {
  type: 'Disposed',
}

export interface Both {
  readonly type: 'Both'
  readonly left: Cause
  readonly right: Cause
}

export const Both = (left: Cause, right: Cause): Both => ({
  type: 'Both',
  left,
  right,
})

export interface Then {
  readonly type: 'Then'
  readonly left: Cause
  readonly right: Cause
}

export const Then = (left: Cause, right: Cause): Then => ({
  type: 'Then',
  left,
  right,
})

/**
 * Pattern match over a Cause
 */
export function match<A, B, C, D>(
  onUnexpected: (error: unknown) => A,
  onDisposed: () => B,
  onBoth: (left: Cause, right: Cause) => C,
  onThen: (left: Cause, right: Cause) => D,
) {
  return (cause: Cause): A | B | C | D => {
    switch (cause.type) {
      case 'Unexpected':
        return onUnexpected(cause.error)
      case 'Disposed':
        return onDisposed()
      case 'Both':
        return onBoth(cause.left, cause.right)
      case 'Then':
        return onThen(cause.left, cause.right)
      default:
        throw new Error(`Unexpcted Cause ${JSON.stringify(cause, null, 2)}`)
    }
  }
}

/**
 * Type-guard for determining if an error is a Cause
 */
export function isCause(error: unknown): error is Cause {
  return isUnexpected(error) || isDisposed(error) || isThen(error) || isBoth(error)
}

/**
 * Type-guard for determining if an error is an Unexpected Cause
 */
export function isUnexpected(error: unknown): error is Unexpected {
  return isObject(error) && error?.type === 'Unexpected'
}

/**
 * Type-guard for determining if an error is an Disposed Cause
 */
export function isDisposed(error: unknown): error is Disposed {
  return isObject(error) && error?.type === 'Disposed'
}

/**
 * Type-guard for determining if an error is an Then Cause
 */
export function isThen(error: unknown): error is Then {
  return isObject(error) && error?.type === 'Then'
}

/**
 * Type-guard for determining if an error is an Both Cause
 */
export function isBoth(error: unknown): error is Both {
  return isObject(error) && error?.type === 'Both'
}

function isObject(error: unknown): error is Record<string, unknown> {
  return typeof error === 'object' && !(error == null)
}
