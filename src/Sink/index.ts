import { constant, constVoid, flow, pipe } from 'fp-ts/function'

import { fromIO, Fx, map as mapFx } from '@/Fx'

export interface Sink<R, E, A, B> {
  readonly event: (input: A) => Fx<R, E, B>
  readonly end: Fx<R, E, unknown>
}

const _void = fromIO(constVoid)

export function make<R, E, A, B = void, R2 = R, E2 = E>(
  sink: {
    readonly event?: (input: A) => Fx<R, E, B>
    readonly end?: Fx<R2, E2, void>
  } = {},
): Sink<R & R2, E | E2, A, B> {
  return {
    event: constant(_void),
    end: _void,
    ...sink,
  } as any
}

export function map<A, B>(f: (a: A) => B) {
  return <R, E, C>(sink: Sink<R, E, C, A>): Sink<R, E, C, B> => ({
    event: flow(sink.event, mapFx(f)),
    end: sink.end,
  })
}

export function local<A, B>(f: (a: A) => B) {
  return <R, E, C>(sink: Sink<R, E, B, C>): Sink<R, E, A, C> => ({
    event: flow(f, sink.event),
    end: sink.end,
  })
}

export function promap<A, B, C, D>(f: (a: A) => B, g: (c: C) => D) {
  return <R, E>(sink: Sink<R, E, B, C>): Sink<R, E, A, D> => pipe(sink, local(f), map(g))
}
