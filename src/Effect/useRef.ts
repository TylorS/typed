import { Arity1 } from '@typed/fp/common'
import { always } from '@typed/fp/lambda'
import * as IO from 'fp-ts/es6/IO'
import { IORef } from 'fp-ts/es6/IORef'
import { pipe } from 'fp-ts/es6/pipeable'

import { doEffect } from './doEffect'
import { Effect } from './Effect'
import { memo } from './memo'
import { createOp, Op, OpEnv, OpKey, OpReturn, performOp, provideOp } from './Op'

export interface Ref<K, A> extends Op<K, readonly [], IORef<A>> {}

export type RefValue<A> = OpReturn<A> extends IORef<infer R> ? R : never

export interface RefEnv<A extends Op> extends OpEnv<A> {}

export const createRef = <R extends Ref<any, any>>(key: OpKey<R>): R => createOp<R>(key)

export const provideRef = <R extends Ref<any, any>>(key: R, newRef: IO.IO<OpReturn<R>>) =>
  provideOp<R, {}>(key, pipe(newRef, Effect.fromIO, memo, always))

export const useRef = (<R extends Ref<any, any>>(R: R) => {
  return [readRef<R>(R), writeRef<R>(R), modifyRef<R>(R)] as const
}) as {
  <R extends Ref<any, any>, E extends RefEnv<R> = RefEnv<R>>(R: R): readonly [
    Effect<E, RefValue<R>>,
    <A extends RefValue<R>>(value: A) => Effect<E, A>,
    <A extends RefValue<R>>(modify: Arity1<A, A>) => Effect<E, A>,
  ]
  <K, A>(R: Ref<K, A>): readonly [
    Effect<RefEnv<typeof R>, A>,
    (value: A) => Effect<RefEnv<typeof R>, A>,
    (modify: Arity1<A, A>) => Effect<RefEnv<typeof R>, A>,
  ]
}

export function readRef<R extends Ref<any, any>, E extends RefEnv<R> = RefEnv<R>>(
  R: R,
): Effect<E, RefValue<R>>
export function readRef<K, A>(R: Ref<K, A>): Effect<RefEnv<typeof R>, A>

export function readRef<K, A>(R: Ref<K, A>): Effect<RefEnv<typeof R>, A> {
  const effect = doEffect(function* () {
    const ref = yield* performOp(R)

    return ref.read()
  })

  return effect
}

export function writeRef<R extends Ref<any, any>, E extends RefEnv<R> = RefEnv<R>>(
  R: R,
): <A extends RefValue<R>>(value: A) => Effect<E, A>
export function writeRef<K, A>(R: Ref<K, A>): (value: A) => Effect<RefEnv<typeof R>, A>

export function writeRef<K, A>(R: Ref<K, A>) {
  return (value: A): Effect<RefEnv<typeof R>, A> => {
    const effect = doEffect(function* () {
      const ref = yield* performOp(R)

      ref.write(value)()

      return value
    })

    return effect
  }
}

export function modifyRef<R extends Ref<any, any>, E extends RefEnv<R> = RefEnv<R>>(
  R: R,
): <A extends RefValue<R>>(modify: Arity1<A, A>) => Effect<E, A>
export function modifyRef<K, A>(R: Ref<K, A>): (modify: Arity1<A, A>) => Effect<RefEnv<typeof R>, A>

export function modifyRef<K, A>(R: Ref<K, A>) {
  return (modify: Arity1<A, A>): Effect<RefEnv<typeof R>, A> => {
    const effect = doEffect(function* () {
      const ref = yield* performOp(R)

      ref.modify(modify)()

      return ref.read()
    })

    return effect
  }
}
