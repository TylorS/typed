import { Env } from '@fp/Env'
import { Fiber } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { GlobalRefs, withGlobalRefs } from '@fp/Global'
import * as R from '@fp/Ref'
import * as WM from '@fp/RefWeakMap'

export const SharedFibers = WM.fromValue<object, Fiber<unknown>>(Symbol('SharedFibers'))

export const getSharedFibers: Env<GlobalRefs, WeakMap<object, Fiber<unknown>>> = pipe(
  SharedFibers,
  R.getRef,
  withGlobalRefs,
)

export const getSharedFiber = (key: object) => pipe(key, WM.getKv(SharedFibers), withGlobalRefs)

export const setSharedFiber = (key: object, value: Fiber<unknown>) =>
  withGlobalRefs(WM.setKv(SharedFibers)(key, value))

export const deleteSharedFiber = (key: object) =>
  pipe(key, WM.deleteKv(SharedFibers), withGlobalRefs)
