import { Sink } from '@most/types'
import { constVoid } from 'fp-ts/function'

export function createEventSink<A>(f: (value: A) => void): Sink<A> {
  return {
    event(_, x) {
      return f(x)
    },
    error: constVoid,
    end: constVoid,
  }
}
