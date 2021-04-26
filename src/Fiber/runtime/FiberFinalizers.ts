import { chain, Env, fromIO } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { Arity1 } from '@fp/function'
import { createRef, getRef, setRef_ } from '@fp/Ref'
import { flow, pipe } from 'fp-ts/function'
import { append } from 'fp-ts/ReadonlyArray'

import { CurrentFiber, usingFiberRefs } from '../Fiber'
import { FiberReturnValue } from './FiberReturnValue'

// A callback that accepts the return value of the fiber it is being run for, none if it
// is being aborted.
export type Finalizer<A> = (
  returnValue: FiberReturnValue<A>,
) => Env<CurrentFiber, any> | Env<unknown, any>

export const FIBER_FINALIZERS = Symbol('FiberFinalizers')

export const FiberFinalizers = <A>() =>
  createRef(
    fromIO((): ReadonlyArray<Finalizer<A>> => []),
    FIBER_FINALIZERS,
    alwaysEqualsEq,
  )

export const getFiberFinalizers = <A>() => pipe(FiberFinalizers<A>(), getRef, usingFiberRefs)

export const setFiberFinalizers = <A>(finalizers: ReadonlyArray<Finalizer<A>>) =>
  pipe(FiberFinalizers<A>(), setRef_(finalizers), usingFiberRefs)

export const modifyFiberFinalizers = <A>(
  f: Arity1<ReadonlyArray<Finalizer<A>>, ReadonlyArray<Finalizer<A>>>,
) => pipe(getFiberFinalizers<A>(), chain(flow(f, setFiberFinalizers)))

export const addFinalizer = <A>(finalizer: Finalizer<A>) => modifyFiberFinalizers(append(finalizer))
