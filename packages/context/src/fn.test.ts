import * as Effect from '@effect/io/Effect'
import { describe, expect, it } from 'vitest'

import { Fn } from './fn.js'

describe(Fn.name, () => {
  it('allows calling a function from Effect context', async () => {
    const Add =
      Fn<(x: number, y: number) => Effect.Effect<never, never, number>>()('@typed/context/Add')

    const test = Add.apply(1, 2).pipe(Add.provideImplementation((x, y) => Effect.succeed(x + y)))

    expect(await Effect.runPromise(test)).toBe(3)
  })
})
