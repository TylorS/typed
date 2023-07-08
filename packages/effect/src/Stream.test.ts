import { describe, expect, it } from 'vitest'

import { StreamEvent, StreamEnd, observe } from './Stream.js'
import { pipe } from './_function.js'
import * as core from './core.js'
import { forEach, withForEachDiscard } from './ops.js'
import { runPromise } from './runtime.js'

describe.only('Stream', () => {
  it('should work', async () => {
    const numEvent = new StreamEvent<number>()
    const stringEvent = new StreamEvent<string>()
    const values: Array<string | number> = []

    const program = pipe(
      numEvent.produceAll(1, 2, 3),
      core.flatMap(() => stringEvent.produceAll('foo', 'bar', 'baz')),
      core.flatMap(() => StreamEnd.produce),
      observe((a) => core.sync(() => values.push(a))),
    )

    await runPromise(program)

    expect(values).toEqual([1, 2, 3, 'foo', 'bar', 'baz'])
  })

  it('should work with other effects', async () => {
    const numEvent = new StreamEvent<number>()
    const stringEvent = new StreamEvent<string>()
    const values: Array<string | number> = []

    const program = pipe(
      forEach([1, 2, 3]),
      core.flatMap(numEvent.produce),
      core.flatMap(() => forEach(['foo', 'bar', 'baz'])),
      core.flatMap(stringEvent.produce),
      withForEachDiscard,
      core.flatMap(() => StreamEnd.produce),
      observe((a) => core.sync(() => values.push(a))),
    )

    await runPromise(program)

    expect(values).toEqual([1, 'foo', 'bar', 'baz', 2, 'foo', 'bar', 'baz', 3, 'foo', 'bar', 'baz'])
  })
})
