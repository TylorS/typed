import { flow, pipe } from 'fp-ts/function'

import { chain, fromIO } from '../../Env'
import { Arity1 } from '../../function'
import { createRef, getRef, setRef } from '../../Ref'
import { Resume } from '../../Resume'
import { withFiberRefs } from '../Fiber'

export const FiberFinalizers = createRef(fromIO((): ReadonlyArray<Resume<unknown>> => []))

export const getFiberFinalizers = pipe(FiberFinalizers, getRef, withFiberRefs)

export const setFiberFinalizers = (finalizers: ReadonlyArray<Resume<unknown>>) =>
  pipe(FiberFinalizers, setRef(finalizers), withFiberRefs)

export const modifyFiberFinalizers = (
  f: Arity1<ReadonlyArray<Resume<unknown>>, ReadonlyArray<Resume<unknown>>>,
) => pipe(getFiberFinalizers, chain(flow(f, setFiberFinalizers)))
