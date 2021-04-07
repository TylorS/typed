import { settable } from '@fp/Disposable'
import { fromIO, map } from '@fp/Env'
import { createRef, getRef } from '@fp/Ref'
import { Disposable } from '@most/types'
import { EqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { withFiberRefs } from '../Fiber'

export const FiberDisposable = createRef(fromIO(settable), undefined, EqStrict)

export const getFiberDisposable = pipe(FiberDisposable, getRef, withFiberRefs)

export const addDisposable = (disposable: Disposable) =>
  pipe(
    getFiberDisposable,
    map((d) => d.addDisposable(disposable)),
  )
