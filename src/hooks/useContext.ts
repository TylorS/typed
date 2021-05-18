import * as E from '@fp/Env'
import { CurrentFiber, Fiber, usingFiberRefs } from '@fp/Fiber'
import { Arity1, flow, pipe } from '@fp/function'
import { deleteRef, getRef, hasRef, makeRef, modifyRef, Ref, setRef, WrappedRef } from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'

import { findProvider } from './findProvider'
import { withProvider } from './withProvider'

export const getContext = <E, A>(ref: Ref<E, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(
      ref,
      getRef,
      usingFiberRefs,
      E.useSome<CurrentFiber>({ currentFiber }),
    ),
  )

export const hasContext = <E, A>(ref: Ref<E, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(
      ref,
      hasRef,
      usingFiberRefs,
      E.useSome<CurrentFiber>({ currentFiber }),
    ),
  )

export const setContext = <E, A>(ref: Ref<E, A>) => (value: A) =>
  withProvider(ref, (currentFiber) =>
    pipe(
      value,
      setRef(ref),
      usingFiberRefs,
      E.useSome<CurrentFiber>({ currentFiber }),
    ),
  )

export const modifyContext = <E, A>(ref: Ref<E, A>) => (f: Arity1<A, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(
      f,
      modifyRef(ref),
      usingFiberRefs,
      E.useSome<CurrentFiber>({ currentFiber }),
    ),
  )

export const deleteContext = <E, A>(ref: Ref<E, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(
      ref,
      deleteRef,
      usingFiberRefs,
      E.useSome<CurrentFiber>({ currentFiber }),
    ),
  )

export interface ContextRef<E, A> extends WrappedRef<CurrentFiber & SchedulerEnv, E, A> {
  readonly provider: E.Env<CurrentFiber<any> & SchedulerEnv, Fiber<unknown>>
}

export function wrapContext<E, A>(ref: Ref<E, A>): ContextRef<E, A> {
  return {
    ...ref,
    get: getContext(ref),
    has: hasContext(ref),
    set: setContext(ref),
    modify: modifyContext(ref),
    delete: deleteContext(ref),
    provider: findProvider(ref),
  }
}

export const createContext = flow(makeRef, wrapContext)
