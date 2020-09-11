import { Arity1 } from '@typed/fp/common/exports'
import { Pure } from '@typed/fp/Effect/exports'

export type GetAndUpdateState<A> = readonly [Pure<A>, (update: Arity1<A, A>) => Pure<A>]
