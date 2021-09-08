import { flow } from 'fp-ts/function'
import { snd } from 'fp-ts/ReadonlyTuple'

import { Fx, map } from '@/Fx'

import { FiberRef } from './FiberRef'
import { modify } from './modify'

const toNullTuple = <A>(a: A) => [null, a] as const

export function update<A, R, E>(f: (a: A) => Fx<R, E, A>): (ref: FiberRef<A>) => Fx<R, E, A> {
  return flow(modify(flow(f, map(toNullTuple))), map(snd))
}
