import { Effect } from '../Effect.js'
import { gen } from '../Effect/Instruction.js'

import { Sink, Stream } from './Stream.js'

export function fromArray<A extends ReadonlyArray<any>>(array: A): Stream.Of<A[number]> {
  return new FromArray(array)
}

export class FromArray<A extends ReadonlyArray<any>> implements Stream.Of<A[number]> {
  readonly [Stream.TypeId] = Stream.Variance

  constructor(readonly array: A) {}

  run<R2>(sink: Sink<R2, never, A[number]>): Effect<R2, never, unknown> {
    const { array } = this

    return gen(function* () {
      for (let i = 0; i < array.length; ++i) {
        yield* sink.event(array[i])
      }

      yield* sink.end
    })
  }
}
