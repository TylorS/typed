import type { FiberId } from '@/Fiber'

export type Cause<E> = Empty | Died | Interrupted | Expected<E> | Then<E> | Both<E>

export interface Empty {
  readonly _tag: 'Empty'
}

export function isEmpty<E>(cause: Cause<E>): cause is Empty {
  return cause._tag === 'Empty'
}

export const Empty: Empty = {
  _tag: 'Empty',
}

export interface Died {
  readonly _tag: 'Died'
  readonly error: unknown
}

export const Died = (error: unknown): Died => ({
  _tag: 'Died',
  error,
})

export function isDied<E>(cause: Cause<E>): cause is Died {
  return cause._tag === 'Died'
}

export interface Interrupted {
  readonly _tag: 'Interrupted'
  readonly fiberId: FiberId
}

export const Interrupted = (fiberId: FiberId): Interrupted => ({
  _tag: 'Interrupted',
  fiberId,
})

export function isInterrupted<E>(cause: Cause<E>): cause is Interrupted {
  return cause._tag === 'Interrupted'
}

export interface Expected<E> {
  readonly _tag: 'Expected'
  readonly error: E
}

export const Expected = <E>(error: E): Expected<E> => ({
  _tag: 'Expected',
  error,
})

export function isExpected<E>(cause: Cause<E>): cause is Expected<E> {
  return cause._tag === 'Expected'
}

export interface Then<E> {
  readonly _tag: 'Then'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export const Then = <E>(left: Cause<E>, right: Cause<E>): Then<E> => ({
  _tag: 'Then',
  left,
  right,
})

export function isThen<E>(cause: Cause<E>): cause is Then<E> {
  return cause._tag === 'Then'
}

export interface Both<E> {
  readonly _tag: 'Both'
  readonly left: Cause<E>
  readonly right: Cause<E>
}

export const Both = <E>(left: Cause<E>, right: Cause<E>): Both<E> => ({
  _tag: 'Both',
  left,
  right,
})

export function isBoth<E>(cause: Cause<E>): cause is Both<E> {
  return cause._tag === 'Both'
}

export const match =
  <A, B, C, E, D, F, G>(
    onEmpty: () => A,
    onDied: (error: unknown) => B,
    onInterrupted: (fiberId: FiberId) => C,
    onExpected: (error: E) => D,
    onThen: (left: Cause<E>, right: Cause<E>) => F,
    onBoth: (left: Cause<E>, right: Cause<E>) => G,
  ) =>
  (cause: Cause<E>): A | B | C | D | F | G => {
    switch (cause._tag) {
      case 'Empty':
        return onEmpty()
      case 'Died':
        return onDied(cause.error)
      case 'Interrupted':
        return onInterrupted(cause.fiberId)
      case 'Expected':
        return onExpected(cause.error)
      case 'Then':
        return onThen(cause.left, cause.right)
      case 'Both':
        return onBoth(cause.left, cause.right)
    }
  }
