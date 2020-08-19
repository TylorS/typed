import * as IO from 'fp-ts/es6/IO'
import { IORef } from 'fp-ts/es6/IORef'
import { pipe } from 'fp-ts/es6/pipeable'

import { Arity1 } from '../common'
import {
  createOp,
  doEffect,
  Effect,
  memo,
  Op,
  OpArgs,
  OpEnv,
  OpKey,
  OpReturn,
  provideOp,
  useOp,
} from '../Effect'
import { always } from '../lambda'

export interface UseRef<K, A> extends Op<K, readonly [], IORef<A>> {}

export type RefValue<A> = OpReturn<A> extends IORef<infer R> ? R : never

export const createRef = <R extends UseRef<any, any>>(key: OpKey<R>): R => createOp<R>(key)

export const provideRef = <R extends UseRef<any, any>>(key: R, ref: IO.IO<OpReturn<R>>) =>
  provideOp<R, {}>(key, pipe(ref, Effect.fromIO, memo, always))

export const useRef = <R extends UseRef<any, any>>(R: R) =>
  [readRef(R), writeRef(R), modifyRef(R)] as const

const EMPTY: readonly any[] = []

const readRef = <R extends UseRef<any, any>>(R: R): Effect<OpEnv<R>, RefValue<R>> => {
  const effect = doEffect(function* () {
    const ref = yield* useOp<R>(R)(...(EMPTY as OpArgs<R>))

    return ref.read()
  })

  return effect
}

const writeRef = <R extends UseRef<any, any>>(R: R) => (
  value: RefValue<R>,
): Effect<OpEnv<R>, RefValue<R>> => {
  const effect = doEffect(function* () {
    const ref = yield* useOp<R>(R)(...(EMPTY as OpArgs<R>))

    ref.write(value)()

    return value
  })

  return effect
}

const modifyRef = <R extends UseRef<any, any>>(R: R) => {
  return (mod: Arity1<RefValue<R>, RefValue<R>>): Effect<OpEnv<R>, RefValue<R>> => {
    const effect = doEffect(function* () {
      const ref = yield* useOp<R>(R)(...(EMPTY as OpArgs<R>))

      ref.modify(mod)()

      return ref.read()
    })

    return effect
  }
}
