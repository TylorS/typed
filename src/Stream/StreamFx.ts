import { Fx } from '@fp/Fx'
import { getRecFxM } from '@fp/FxT'
import { Arity1 } from '@fp/lambda'
import { Stream } from '@most/types'

import { Apply, MonadRecChain } from './fp-ts'

export interface StreamFx<A> extends Fx<Stream<unknown>, A> {}

export type GetResult<A> = A extends StreamFx<infer R> ? R : never

const streamFxM = getRecFxM({ ...MonadRecChain, ...Apply })

export const of: <A>(value: A) => StreamFx<A> = streamFxM.of

export const ap: <A>(fa: StreamFx<A>) => <B>(fab: StreamFx<Arity1<A, B>>) => StreamFx<B> =
  streamFxM.ap

export const map: <A, B>(f: Arity1<A, B>) => (fa: StreamFx<A>) => StreamFx<B> = streamFxM.map

export const chain: <A, B>(f: Arity1<A, StreamFx<B>>) => (fa: StreamFx<A>) => StreamFx<B> =
  streamFxM.chain

export const fromStream: <A>(stream: Stream<A>) => StreamFx<A> = streamFxM.fromMonad

export const toStream: <A>(fx: StreamFx<A>) => Stream<A> = streamFxM.toMonad

export const doStream: <Y extends Stream<any>, R, N = unknown>(
  f: (lift: typeof fromStream) => Generator<Y, R, N>,
) => StreamFx<R> = streamFxM.doMonad
