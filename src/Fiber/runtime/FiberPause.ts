import { Disposable } from '@most/types'
import { EqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { getEq, none, Option, some } from 'fp-ts/Option'

import { fromIO } from '../../Env'
import { createRef, getRef, setRef } from '../../Ref'
import { withFiberRefs } from '../Fiber'

export const FiberPause = createRef(
  fromIO((): Option<IO<Disposable>> => none),
  undefined,
  getEq(EqStrict),
)

export const getFiberPause = pipe(FiberPause, getRef, withFiberRefs)

export const setFiberPause = (resume: IO<Disposable>) =>
  pipe(FiberPause, setRef(some(resume)), withFiberRefs)
