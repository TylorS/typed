import { flow } from 'fp-ts/function'
import { fst } from 'fp-ts/ReadonlyTuple'

import { map, Pure } from '@/Fx'

import { FiberRef } from './FiberRef'
import { modify } from './modify'

const toTuple = <A>(x: A): readonly [A, A] => [x, x]

export const get: <A>(ref: FiberRef<A>) => Pure<A> = flow(modify(toTuple), map(fst))
