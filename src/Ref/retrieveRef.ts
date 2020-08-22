import { Effect } from '@typed/fp/Effect'
import { callOp, ReturnOf } from '@typed/fp/Op'

import { Ref, RefEnv } from './Ref'

export const retrieveRef = <R extends Ref<any, any>>(ref: R): Effect<RefEnv<R>, ReturnOf<R>> =>
  (callOp(ref) as () => Effect<RefEnv<R>, ReturnOf<R>>)()
