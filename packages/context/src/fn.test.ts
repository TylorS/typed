import * as Effect from '@effect/io/Effect'
import { describe, expect, it } from 'vitest'

import { Fn } from './fn.js'
import { id } from './identifier.js'

describe(Fn.name, () => {
  it('allows calling a function from Effect context', async () => {
    class AddService extends id('@typed/context/AddService') {}
    const Add = Fn<(x: number, y: number) => Effect.Effect<never, never, number>>()(AddService)

    const test = Add.apply(1, 2).pipe(Add.provideImplementation((x, y) => Effect.succeed(x + y)))

    expect(await Effect.runPromise(test)).toBe(3)
  })
})
