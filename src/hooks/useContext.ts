import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { Arity1, flow, pipe } from '@fp/function'
import * as R from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'

import { findProvider } from './findProvider'
import { useReplicateRefEvents } from './useReplicateRefEvents'
import { withProvider } from './withProvider'

/**
 * Gets and Subscribes to future updates regarding a Reference
 */
export const useContext = <E, A>(ref: R.Ref<E, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(
      useReplicateRefEvents(currentFiber, ref),
      E.chain(() => getRefUsingFiber(ref, currentFiber)),
    ),
  )

export const getContext = <E, A>(ref: R.Ref<E, A>) =>
  withProvider(ref, (currentFiber) => getRefUsingFiber(ref, currentFiber))

const getRefUsingFiber = <E, A>(ref: R.Ref<E, A>, currentFiber: F.Fiber<unknown>) =>
  pipe(ref, R.getRef, F.withFiberRefs(currentFiber))

export const hasContext = <E, A>(ref: R.Ref<E, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(ref, R.hasRef, F.usingFiberRefs, E.useSome<F.CurrentFiber>({ currentFiber })),
  )

export const setContext =
  <E, A>(ref: R.Ref<E, A>) =>
  (value: A) =>
    withProvider(ref, (currentFiber) =>
      pipe(value, R.setRef(ref), F.usingFiberRefs, E.useSome<F.CurrentFiber>({ currentFiber })),
    )

export const setContext_ =
  <A>(value: A) =>
  <E>(ref: R.Ref<E, A>) =>
    setContext(ref)(value)

export const modifyContext =
  <E, A>(ref: R.Ref<E, A>) =>
  (f: Arity1<A, A>) =>
    withProvider(ref, (currentFiber) =>
      pipe(f, R.modifyRef(ref), F.usingFiberRefs, E.useSome<F.CurrentFiber>({ currentFiber })),
    )

export const modifyContext_ =
  <A>(f: Arity1<A, A>) =>
  <E>(ref: R.Ref<E, A>) =>
    modifyContext(ref)(f)

export const deleteContext = <E, A>(ref: R.Ref<E, A>) =>
  withProvider(ref, (currentFiber) =>
    pipe(ref, R.deleteRef, F.usingFiberRefs, E.useSome<F.CurrentFiber>({ currentFiber })),
  )

export interface ContextRef<E, A> extends R.WrappedRef<F.CurrentFiber, E, A> {
  readonly use: E.Env<E & F.CurrentFiber & SchedulerEnv, A>
  readonly provider: E.Env<F.CurrentFiber, F.Fiber<unknown>>
}

export function wrapContext<E, A>(ref: R.Ref<E, A>): ContextRef<E, A> {
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

export const createContext = flow(R.makeRef, wrapContext)
