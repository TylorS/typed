import * as E from '@fp/Env'
import { CurrentFiber, Fiber, usingFiberRefs } from '@fp/Fiber'
import { Arity1, flow, pipe } from '@fp/function'
import { deleteRef, getRef, hasRef, makeRef, modifyRef, Ref, setRef, WrappedRef } from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'

import { findProvider } from './findProvider'
import { useReplicateRefEvents } from './useReplicateRefEvents'
import { withProvider } from './withProvider'

/**
 * Gets and Subscribes to future updates regarding a Reference
 */
export const useContext = <E, A>(ref: Ref<E, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(
      useReplicateRefEvents(currentFiber, ref),
      E.chain(() =>
        pipe(
          ref,
          getRef,
          usingFiberRefs,
          E.useSome<CurrentFiber>({ currentFiber }),
        ),
      ),
    ),
  )

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

export const setContext_ = <A>(value: A) => <E>(ref: Ref<E, A>) => setContext(ref)(value)

export const modifyContext = <E, A>(ref: Ref<E, A>) => (f: Arity1<A, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(
      f,
      modifyRef(ref),
      usingFiberRefs,
      E.useSome<CurrentFiber>({ currentFiber }),
    ),
  )

export const modifyContext_ = <A>(f: Arity1<A, A>) => <E>(ref: Ref<E, A>) => modifyContext(ref)(f)

export const deleteContext = <E, A>(ref: Ref<E, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(
      ref,
      deleteRef,
      usingFiberRefs,
      E.useSome<CurrentFiber>({ currentFiber }),
    ),
  )

export interface ContextRef<E, A> extends WrappedRef<CurrentFiber, E, A> {
  readonly use: E.Env<E & CurrentFiber & SchedulerEnv, A>
  readonly provider: E.Env<CurrentFiber, Fiber<unknown>>
}

export function wrapContext<E, A>(ref: Ref<E, A>): ContextRef<E, A> {
  return {
    id: ref.id,
    initial: ref.initial,
    eq: ref.eq,
    use: useContext(ref),
    get: getContext(ref),
    has: hasContext(ref),
    set: setContext(ref),
    modify: modifyContext(ref),
    delete: deleteContext(ref),
    provider: findProvider(ref),
  }
}

export const createContext = flow(makeRef, wrapContext)
