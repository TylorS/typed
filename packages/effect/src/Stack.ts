import { Predicate } from '@effect/data/Predicate'

/** @internal */
export class Stack<A> {
  constructor(readonly value: A, readonly previous: Stack<A> | null) {}

  takeUntil(
    predicate: Predicate<A>,
  ): readonly [taken: Stack<A> | null, remaining: Stack<A> | null] {
    const toKeep: Array<A> = []

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: Stack<A> | null = this

    while (current) {
      const shouldContinue = predicate(current.value)

      toKeep.push(current.value)
      current = current.previous

      if (!shouldContinue) {
        break
      }
    }

    return [
      toKeep.reduceRight((previous, value) => new Stack(value, previous), null as Stack<A> | null),
      current || null,
    ]
  }
}
