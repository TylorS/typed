import { constant, flow } from 'fp-ts/function'
import { snd } from 'fp-ts/ReadonlyTuple'

import { fromIO, map, Pure } from '@/Fx'

import { FiberRef } from './FiberRef'
import { modify } from './modify'

const toTuple = <A>(a: A): readonly [A, A] => [a, a]

export const get: <A>(ref: FiberRef<A>) => Pure<A> = flow(
  modify(flow(toTuple, constant, fromIO)),
  map(snd),
)
