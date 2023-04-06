import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Effect, Scope } from '@typed/fx/internal/_externals'

export const zipItemsWith: {
  <R, E, A, B, C>(self: Fx<R, E, A>, items: Iterable<B>, f: (a: A, b: B) => C): Fx<R, E, C>
  <A, B, C>(items: Iterable<B>, f: (a: A, b: B) => C): <R, E>(self: Fx<R, E, A>) => Fx<R, E, C>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, B, C>(self: Fx<R, E, A>, items: Iterable<B>, f: (a: A, b: B) => C) =>
      new ZipItemsWithFx(self, items, f).traced(trace),
)

export const zipItems: {
  <R, E, A, B>(self: Fx<R, E, A>, items: Iterable<B>): Fx<R, E, readonly [A, B]>
  <B>(items: Iterable<B>): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, readonly [A, B]>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(self: Fx<R, E, A>, items: Iterable<B>) =>
      zipItemsWith(self, items, (a, b) => [a, b] as const).traced(trace),
)

export const withItems: {
  <R, E, A, B>(self: Fx<R, E, A>, items: Iterable<B>): Fx<R, E, B>
  <B>(items: Iterable<B>): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(self: Fx<R, E, A>, items: Iterable<B>) =>
      zipItemsWith(self, items, (_, b) => b).traced(trace),
)

export class ZipItemsWithFx<R, E, A, B, C> extends BaseFx<R, E, C> {
  readonly name = 'ZipItemsWith' as const

  constructor(
    readonly self: Fx<R, E, A>,
    readonly items: Iterable<B>,
    readonly f: (a: A, b: B) => C,
  ) {
    super()
  }

  run(sink: Sink<E, C>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return Effect.suspend(() => {
      const iterator = this.items[Symbol.iterator]()

      return this.self.run(
        Sink(
          (a) => {
            const next = iterator.next()

            if (next.done) {
              return sink.end()
            }

            return sink.event(this.f(a, next.value))
          },
          sink.error,
          sink.end,
        ),
      )
    })
  }
}
