import { Predicate } from '@effect/data/Predicate'

/** @internal */
export class Stack<A> {
  constructor(readonly value: A, readonly previous: Stack<A> | null) {}
}

export function toArray<A>(stack: Stack<A>): Array<A> {
  const result: Array<A> = []
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  let current: Stack<A> | null = stack

  while (current) {
    result.push(current.value)
    current = current.previous
  }

  return result
}

export function takeUntil<A>(
  stack: Stack<A>,
  predicate: Predicate<A>,
): readonly [taken: Stack<A> | null, remaining: Stack<A> | null] {
  const toKeep: Array<A> = []

  // eslint-disable-next-line @typescript-eslint/no-this-alias
  let current: Stack<A> | null = stack

  while (current) {
    if (predicate(current.value)) break

    toKeep.push(current.value)
    current = current.previous
  }

  return [
    toKeep.reduceRight((previous, value) => new Stack(value, previous), null as Stack<A> | null),
    current || null,
  ]
}

export function concat<A>(self: Stack<A>, stack: Stack<A>): Stack<A> {
  return toArray(stack).reduceRight(
    (previous, value) => new Stack(value, previous),
    self as Stack<A>,
  )
}
