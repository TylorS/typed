import { Disposable } from '@most/types'
import { EqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { settable } from '../../Disposable'
import { fromIO, map } from '../../Env'
import { createRef, getRef } from '../../Ref'
import { withFiberRefs } from '../Fiber'

export const FiberDisposable = createRef(fromIO(settable), undefined, EqStrict)

export const getFiberDisposable = pipe(FiberDisposable, getRef, withFiberRefs)

export const addDisposable = (disposable: Disposable) =>
  pipe(
    getFiberDisposable,
    map((d) => d.addDisposable(disposable)),
  )
