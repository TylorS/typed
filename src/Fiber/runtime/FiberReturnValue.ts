import { fromIO } from '@fp/Env'
import { neverEqualsEq } from '@fp/Eq'
import { createRef, getRef, setRef } from '@fp/Ref'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { withFiberRefs } from '../Fiber'

export const FIBER_RETURN_VALUE = Symbol('FiberReturnValue')

export type FiberReturnValue<A> = O.Option<E.Either<Error, A>>

export const FiberReturnValue = <A>() =>
  createRef(
    fromIO((): FiberReturnValue<A> => O.none),
    FIBER_RETURN_VALUE,
    neverEqualsEq,
  )

export const getFiberReturnValue = <A>() => pipe(FiberReturnValue<A>(), getRef, withFiberRefs)

export const setFiberReturnValue = <A>(returnValue: E.Either<Error, A>) =>
  pipe(FiberReturnValue<A>(), setRef(O.some(returnValue)), withFiberRefs)
