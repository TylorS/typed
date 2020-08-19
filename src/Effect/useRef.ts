import { Arity1 } from '@typed/fp/common'
import { always } from '@typed/fp/lambda'
import * as IO from 'fp-ts/es6/IO'
import { IORef } from 'fp-ts/es6/IORef'
import { pipe } from 'fp-ts/es6/pipeable'

import { doEffect } from './doEffect'
import { Effect } from './Effect'
import { memo } from './memo'
import { createOp, Op, OpArgs, OpEnv, OpKey, OpReturn, provideOp, useOp } from './Op'

export interface Ref<K, A> extends Op<K, readonly [], IORef<A>> {}

export type RefValue<A> = OpReturn<A> extends IORef<infer R> ? R : never

export const createRef = <R extends Ref<any, any>>(key: OpKey<R>): R => createOp<R>(key)

export const provideRef = <R extends Ref<any, any>>(key: R, ref: IO.IO<OpReturn<R>>) =>
  provideOp<R, {}>(key, pipe(ref, Effect.fromIO, memo, always))

export const useRef = <R extends Ref<any, any>>(R: R) =>
  [readRef(R), writeRef(R), modifyRef(R)] as const

const EMPTY: readonly any[] = []

export const readRef = <R extends Ref<any, any>>(R: R): Effect<OpEnv<R>, RefValue<R>> => {
  const effect = doEffect(function* () {
    const ref = yield* useOp<R>(R)(...(EMPTY as OpArgs<R>))

    return ref.read()
  })

  return effect
}

export const writeRef = <R extends Ref<any, any>>(R: R) => (
  value: RefValue<R>,
): Effect<OpEnv<R>, RefValue<R>> => {
  const effect = doEffect(function* () {
    const ref = yield* useOp<R>(R)(...(EMPTY as OpArgs<R>))

    ref.write(value)()

    return value
  })

  return effect
}

export const modifyRef = <R extends Ref<any, any>>(R: R) => {
  return (mod: Arity1<RefValue<R>, RefValue<R>>): Effect<OpEnv<R>, RefValue<R>> => {
    const effect = doEffect(function* () {
      const ref = yield* useOp<R>(R)(...(EMPTY as OpArgs<R>))

      ref.modify(mod)()

      return ref.read()
    })

    return effect
  }
}
