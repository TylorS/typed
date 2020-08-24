import { Arity1 } from '@typed/fp/common'
import { Effect, Pure } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'
import { Eq } from 'fp-ts/es6/Eq'

export type UseState<A> = readonly [Pure<A>, (update: Arity1<A, A>) => Pure<A>]

export const USE_STATE = Symbol('@typed/fp/hooks/UseState')
export type USE_STATE = typeof USE_STATE

export interface UseStateOp
  extends Op<USE_STATE, <E, A>(initial: Effect<E, A>, eq: Eq<A>) => Effect<E, UseState<A>>> {}
export const UseStateOp = createOp<UseStateOp>(USE_STATE)

export const useState = callOp(UseStateOp)

declare module '@typed/fp/Op' {
  export interface Ops<Env> {
    readonly [USE_STATE]: {
      <E, A>(initial: Effect<E, A>): Effect<Env & E, UseState<A>>
      <E, A>(initial: Effect<E, A>, eq: Eq<A>): Effect<Env & E, UseState<A>>
    }
  }
}
