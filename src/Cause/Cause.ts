export type Cause<E> = Expected<E> | Unexpected | Interrupted

export interface Expected<E> {
  readonly type: 'Expected'
  readonly error: E
}

export const expected = <E>(error: E): Expected<E> => ({ type: 'Expected', error })

export interface Unexpected {
  readonly type: 'Unexpected'
  readonly error: unknown
}

export const unexpected = (error: unknown): Unexpected => ({ type: 'Unexpected', error })

export interface Interrupted {
  readonly type: 'Interrupted'
}

export const interrupted: Interrupted = {
  type: 'Interrupted',
}

export function isCause(x: unknown): x is Cause<any> {
  return (
    x !== null &&
    typeof x === 'object' &&
    ['Expected', 'Unexpected', 'Interrupted'].includes((x as Cause<any>).type)
  )
}

export const flatten = <E>(cause: Cause<Cause<E>>): Cause<E> =>
  cause.type === 'Expected' ? cause.error : cause

export function match<E, A, B, C>(
  onExpected: (e: E) => A,
  onUnexpected: (error: unknown) => B,
  onInterrupted: () => C,
) {
  return (cause: Cause<E>): A | B | C => {
    switch (cause.type) {
      case 'Expected':
        return onExpected(cause.error)
      case 'Unexpected':
        return onUnexpected(cause.error)
      case 'Interrupted':
        return onInterrupted()
    }
  }
}
