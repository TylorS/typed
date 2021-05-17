import { Env, useSome } from '@fp/Env'
import { CurrentFiber, Fiber, usingFiberRefs } from '@fp/Fiber'
import { Arity1, flow, pipe } from '@fp/function'
import { deleteRef, getRef, hasRef, makeRef, modifyRef, Ref, setRef, WrappedRef } from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'

import { findProvider } from './findProvider'
import { withProvider } from './withProvider'

export const getContext = <E, A>(ref: Ref<E, A>) =>
  withProvider(ref, (provider) =>
    pipe(ref, getRef, usingFiberRefs, useSome<CurrentFiber>({ currentFiber: provider })),
  )

export const hasContext = <E, A>(ref: Ref<E, A>) =>
  withProvider(ref, (provider) =>
    pipe(ref, hasRef, usingFiberRefs, useSome<CurrentFiber>({ currentFiber: provider })),
  )

export const setContext =
  <E, A>(ref: Ref<E, A>) =>
  (value: A) =>
    withProvider(ref, (provider) =>
      pipe(value, setRef(ref), usingFiberRefs, useSome<CurrentFiber>({ currentFiber: provider })),
    )

export const modifyContext =
  <E, A>(ref: Ref<E, A>) =>
  (f: Arity1<A, A>) =>
    withProvider(ref, (provider) =>
      pipe(f, modifyRef(ref), usingFiberRefs, useSome<CurrentFiber>({ currentFiber: provider })),
    )

export const deleteContext = <E, A>(ref: Ref<E, A>) =>
  withProvider(ref, (provider) =>
    pipe(ref, deleteRef, usingFiberRefs, useSome<CurrentFiber>({ currentFiber: provider })),
  )

export const wrapContext = <E, A>(
  ref: Ref<E, A>,
): WrappedRef<CurrentFiber & SchedulerEnv & E, E, A> & {
  readonly provider: Env<CurrentFiber<any> & SchedulerEnv & E, Fiber<unknown>>
} => ({
  ...ref,
  get: getContext(ref),
  has: hasContext(ref),
  set: setContext(ref),
  modify: modifyContext(ref),
  delete: deleteContext(ref),
  provider: findProvider(ref),
})

export const createContext = flow(makeRef, wrapContext)
