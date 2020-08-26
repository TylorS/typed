import { Arity1 } from '@typed/fp/common'
import { Pure } from '@typed/fp/Effect'

export type GetAndUpdateState<A> = readonly [Pure<A>, (update: Arity1<A, A>) => Pure<A>]
