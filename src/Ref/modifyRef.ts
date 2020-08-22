import { Arity1 } from '@typed/fp/common'
import { chain, Effect, map } from '@typed/fp/Effect'
import { pipe } from 'fp-ts/es6/pipeable'

import { readRef } from './readRef'
import { Ref, RefEnv, RefValue } from './Ref'
import { writeRef } from './writeRef'

export const modifyRef = <R extends Ref<any, any>>(ref: R) => (
  f: Arity1<RefValue<R>, RefValue<R>>,
): Effect<RefEnv<R>, RefValue<R>> => pipe(ref, readRef, map(f), chain(writeRef(ref)))
