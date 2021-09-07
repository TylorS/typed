import { flow } from 'fp-ts/function'

import { Fx } from '@/Fx/Fx'
import * as Sink from '@/Sink'

export interface Stream<R, E, A> {
  readonly _R?: (r: R) => void
  readonly _E?: () => E
  readonly _A?: () => A

  readonly runStream: <R2, E2, B>(sink: Sink.Sink<R2, E2, A, B>) => Fx<R & R2, E | E2, void>
}

export type RequirementsOf<A> = [A] extends [Stream<infer R, any, any>] ? R : never

export type ErrorOf<A> = [A] extends [Stream<any, infer R, any>] ? R : never

export type ValueOf<A> = [A] extends [Stream<any, any, infer R>] ? R : never

export const make = <R, E, A>(runStream: Stream<R, E, A>['runStream']): Stream<R, E, A> => ({
  runStream,
})

export const map =
  <A, B>(f: (a: A) => B) =>
  <R, E>(stream: Stream<R, E, A>): Stream<R, E, B> => ({
    runStream: flow(Sink.local(f), stream.runStream),
  })
