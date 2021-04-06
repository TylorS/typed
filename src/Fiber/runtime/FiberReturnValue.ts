import { Either } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/Option'

import { fromIO } from '../../Env'
import { createRef, getRef, setRef } from '../../Ref'
import { withFiberRefs } from '../Fiber'

export const FIBER_RETURN_VALUE = Symbol('FiberReturnValue')

export const FiberReturnValue = <A>() => createRef(fromIO((): Option<Either<Error, A>> => none))

export const getFiberReturnValue = <A>() => pipe(FiberReturnValue<A>(), getRef, withFiberRefs)

export const setFiberReturnValue = <A>(returnValue: Either<Error, A>) =>
  pipe(FiberReturnValue<A>(), setRef(some(returnValue)), withFiberRefs)
