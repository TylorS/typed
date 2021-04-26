import { fromIO } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { createRef, getRef, setRef_ } from '@fp/Ref'
import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { none, Option, some } from 'fp-ts/Option'

import { usingFiberRefs } from '../../Fiber'

export const FiberPause = createRef(
  fromIO((): Option<IO<Disposable>> => none),
  Symbol('FiberPause'),
  alwaysEqualsEq,
)

export const getFiberPause = pipe(FiberPause, getRef, usingFiberRefs)

export const setFiberPause = (resume: IO<Disposable>) =>
  pipe(FiberPause, setRef_(some(resume)), usingFiberRefs)
