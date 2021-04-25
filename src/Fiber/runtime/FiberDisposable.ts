import { disposeBoth, settable } from '@fp/Disposable'
import * as E from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { createRef, getRef } from '@fp/Ref'
import { Disposable } from '@most/types'
import { constVoid, pipe } from 'fp-ts/function'

import { withFiberRefs } from '../Fiber'
import { addFinalizer } from './FiberFinalizers'
import { foldReturnValue } from './FiberReturnValue'

export const FiberDisposable = createRef(
  E.fromIO(settable),
  Symbol('FiberDisposable'),
  alwaysEqualsEq,
)

export const getFiberDisposable = pipe(FiberDisposable, getRef, withFiberRefs)

export type AddDisposableOptions = {
  /**
   * Determines if the resource should exist just for the lifetime of the fiber.
   * If true the resource will be disposed of at the beginning when completing in addition
   * to abortion and failures.
   */
  readonly onComplete?: boolean
}

const noOp = () => E.fromIO(constVoid)

/**
 * Allows configuring a Disposable resource to be associated
 */
export const addDisposable = (disposable: Disposable, options: AddDisposableOptions = {}) =>
  pipe(
    getFiberDisposable,
    E.chain((d) => E.of(disposeBoth(d.addDisposable(disposable), disposable))),
    E.chain((d) => {
      const { onComplete = true } = options
      const dispose = () => E.fromIO(d.dispose)

      return pipe(
        addFinalizer(foldReturnValue(dispose, dispose, onComplete ? dispose : noOp)),
        E.map(() => d),
      )
    }),
  )
