import type { Trace } from "@effect/data/Debug"
import { suspend, unit, zipRight } from "@effect/io/Effect"
import type { Fx, Sink } from "@typed/fx/Fx"
import { BaseFx } from "@typed/fx/Fx"

export function fromIterable<A>(iterable: Iterable<A>): Fx<never, never, A> {
  return new FromIterable(iterable)
}

export class FromIterable<A> extends BaseFx<never, never, A> {
  constructor(readonly iterable: Iterable<A>, readonly trace?: Trace) {
    super(trace)
  }

  run<R2>(sink: Sink<R2, never, A>) {
    const { iterable } = this

    return suspend(() => {
      const iterator = iterable[Symbol.iterator]()
      let next = iterator.next()

      if (next.done) {
        return unit()
      }

      let effect = sink.event(next.value)

      while (!next.done) {
        effect = zipRight(effect, sink.event(next.value))
        next = iterator.next()
      }

      return effect
    }).traced(this.trace)
  }
}
