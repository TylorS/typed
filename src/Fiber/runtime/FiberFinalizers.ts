import { Either } from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { append } from 'fp-ts/ReadonlyArray'

import { chain, fromIO } from '../../Env'
import { Arity1 } from '../../function'
import { createRef, getRef, setRef } from '../../Ref'
import { Resume } from '../../Resume'
import { withFiberRefs } from '../Fiber'

// A callback that accepts the return value of the fiber it is being run for
export type Finalizer = (returnValue: Option<Either<Error, unknown>>) => Resume<unknown>

export const FiberFinalizers = createRef(fromIO((): ReadonlyArray<Finalizer> => []))

export const getFiberFinalizers = pipe(FiberFinalizers, getRef, withFiberRefs)

export const setFiberFinalizers = (finalizers: ReadonlyArray<Finalizer>) =>
  pipe(FiberFinalizers, setRef(finalizers), withFiberRefs)

export const modifyFiberFinalizers = (
  f: Arity1<ReadonlyArray<Finalizer>, ReadonlyArray<Finalizer>>,
) => pipe(getFiberFinalizers, chain(flow(f, setFiberFinalizers)))

export const addFinalizer = (finalizer: Finalizer) => pipe(modifyFiberFinalizers(append(finalizer)))
