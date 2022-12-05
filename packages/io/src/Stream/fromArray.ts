import { flatMap } from '../Effect.js'

import { Stream } from './Stream.js'

export function fromArray<A extends ReadonlyArray<any>>(array: A): Stream.Of<A[number]> {
  return Stream((sink, scheduler) => {
    if (array.length === 0) return sink.end(scheduler.getTime())

    const [first, ...rest] = array.map((a) => sink.event(scheduler.getTime(), a))

    return rest.reduce((prev, curr) => flatMap(() => curr)(prev), first)
  })
}
