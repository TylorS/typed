import { ok } from 'assert'

import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import { it, expect } from 'vitest'

import type { Fx } from './Fx.js'
import { observe } from './observe.js'

export function testCollectAll<E = never, A = never>(
  name: string,
  fx: Fx<never, E, A>,
  expected: ReadonlyArray<A>,
) {
  it.concurrent(name, async () => {
    const test = Effect.scoped(
      Effect.gen(function* ($) {
        const values: Array<A> = []

        yield* $(observe(fx, (a) => Effect.sync(() => values.push(a))))

        return values
      }),
    )

    expect(await Effect.runPromise(test)).toEqual(expected)
  })
}

export function testCause<E, A>(name: string, fx: Fx<never, E, A>, expected: Cause.Cause<E>) {
  it(name, async () => {
    const exit = await Effect.runPromiseExit(Effect.scoped(observe(fx, () => Effect.unit())))

    ok(Exit.isFailure(exit))
    expect(Cause.unannotate(exit.cause)).toEqual(expected)
  })
}
