export type Cause = Unexpected | Interrupted

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

export function isCause(x: unknown): x is Cause {
  return (
    x !== null &&
    typeof x === 'object' &&
    ['Expected', 'Unexpected', 'Interrupted'].includes((x as Cause).type)
  )
}

export function match<A, B>(onUnexpected: (error: unknown) => A, onInterrupted: () => B) {
  return (cause: Cause): A | B => {
    switch (cause.type) {
      case 'Unexpected':
        return onUnexpected(cause.error)
      case 'Interrupted':
        return onInterrupted()
    }
  }
}
