import { Effect, memo, ReturnOf } from '@typed/fp/Effect/exports'
import { always } from '@typed/fp/lambda/exports'
import { FnOf, provideOp } from '@typed/fp/Op/exports'
import { IO } from 'fp-ts/es6/IO'
import { pipe } from 'fp-ts/es6/pipeable'

import { SharedRef } from './SharedRef'

export const provideSharedRef = <R extends SharedRef<any, any>>(
  key: R,
  newRef: IO<ReturnOf<ReturnType<FnOf<R>>>>,
) => provideOp(key, pipe(newRef, Effect.fromIO, memo, always))
