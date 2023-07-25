import * as Effect from '@effect/io/Effect'
import { describe, expect, it } from 'vitest'

import { FnClass } from './fn-class.js'

describe(FnClass.name, () => {
  it('allows calling a function from Effect context', async () => {
    class Add extends FnClass<(x: number, y: number) => Effect.Effect<never, never, number>>() {
      readonly _tag = 'Add' as const

      static increment = (x: number) => Add.apply(x, 1)
      static decrement = (x: number) => Add.apply(x, -1)

      static live = Add.implement((x, y) => Effect.succeed(x + y))
    }

    const test = Add.apply(1, 2).pipe(
      Effect.flatMap((x) => Add.increment(x)),
      Effect.flatMap((x) => Add.decrement(x)),
      Effect.provideLayer(Add.live),
    )

    expect(await Effect.runPromise(test)).toBe(3)
  })
})
