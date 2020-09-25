import { Effect } from '@typed/fp/Effect/exports'
import { callOp, createOp, Op } from '@typed/fp/Op/exports'
import { Eq } from 'fp-ts/Eq'

import { UseState } from './GetAndUpdateState'

export const USE_STATE = Symbol('@typed/fp/hooks/UseState')
export type USE_STATE = typeof USE_STATE

export interface UseStateOp
  extends Op<USE_STATE, <E, A>(initial: Effect<E, A>, eq: Eq<A>) => Effect<E, UseState<A>>> {}

export const UseStateOp = createOp<UseStateOp>(USE_STATE)

export const useState = callOp(UseStateOp)

declare module '@typed/fp/Op/exports' {
  export interface Ops<Env> {
    readonly [USE_STATE]: {
      <E, A>(initial: Effect<E, A>): Effect<Env & E, UseState<A>>
      <E, A>(initial: Effect<E, A>, eq: Eq<A>): Effect<Env & E, UseState<A>>
    }
  }
}
