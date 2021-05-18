import { fromIO } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { createRef, getRef, setRef_ } from '@fp/Ref'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { usingFiberRefs } from '../Fiber'

export const FIBER_RETURN_VALUE = Symbol('FiberReturnValue')

export type FiberReturnValue<A> = O.Option<E.Either<Error, A>>

export const FiberReturnValue = <A>() =>
  createRef(
    fromIO((): FiberReturnValue<A> => O.none),
    FIBER_RETURN_VALUE,
    alwaysEqualsEq,
  )

export const getFiberReturnValue = <A>() => pipe(FiberReturnValue<A>(), getRef, usingFiberRefs)

export const setFiberReturnValue = <A>(returnValue: E.Either<Error, A>) =>
  pipe(FiberReturnValue<A>(), setRef_(O.some(returnValue)), usingFiberRefs)

export const foldReturnValue = <A, B, C, D>(
  aborted: () => A,
  failure: (error: Error) => B,
  success: (value: C) => D,
) => (returnValue: FiberReturnValue<C>): A | B | D =>
  pipe(returnValue, O.matchW(aborted, E.matchW(failure, success)))
