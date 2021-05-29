import * as E from '@fp/Env'
import { flow } from '@fp/function'
import { doEnv, toEnv } from '@fp/Fx/Env'
import * as FxT from '@fp/FxT'
import { Refs } from '@fp/Ref'

import { CurrentFiber, usingFiberRefs } from './Fiber'

/**
 * A special instance of Do notation which will replace Refs for CurrentFiber.
 */
export const DoF = flow(doEnv, toEnv, usingFiberRefs) as <
  Y extends E.Env<any, any> | E.Env<Refs, any>,
  R,
  N = unknown
>(
  f: (lift: FxT.LiftFx2<'@typed/fp/Env'>) => Generator<Y, R, N>,
) => [Y] extends [E.Env<Refs, any>]
  ? E.Env<CurrentFiber, R>
  : [Y] extends [E.Env<infer E & Refs, any>]
  ? E.Env<E & CurrentFiber, R>
  : never
