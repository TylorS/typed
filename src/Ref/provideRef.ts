import { Effect, memo } from '@typed/fp/Effect'
import { always } from '@typed/fp/lambda'
import { provideOp, ReturnOf } from '@typed/fp/Op'
import { IO } from 'fp-ts/es6/IO'
import { pipe } from 'fp-ts/es6/pipeable'

import { Ref } from './Ref'

export const provideRef = <R extends Ref<any, any>>(key: R, newRef: IO<ReturnOf<R>>) =>
  provideOp<R, {}>(key, pipe(newRef, Effect.fromIO, memo, always))
