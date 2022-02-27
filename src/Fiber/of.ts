import { Sync } from '@/Disposable'
import * as FE from '@/Effect/FromExit'
import { success } from '@/Exit'
import { constVoid } from '@/Prelude/function'

import { Fiber, Status } from './Fiber'

export const of = <A, E = never>(value: A): Fiber<E, A> => ({
  type: 'SyntheticFiber',
  status: FE.of<Status>({ type: 'Completed' }),
  exit: FE.of(success(value)),
  inheritRefs: FE.of(undefined),
  dispose: () => Sync(constVoid),
})
