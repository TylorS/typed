import { Fx, map as map_, pure } from '@typed/fp/Fx'
import * as FxT from '@typed/fp/FxT'
import { Arity1 } from '@typed/fp/lambda'
import { MonadRec } from '@typed/fp/Reader/chainRec'
import { Apply, Reader, URI } from 'fp-ts/dist/Reader'

export interface ReaderFx<R, A> extends Fx<Reader<R, any>, A> {}

export type GetRequirements<A> = A extends ReaderFx<infer R, any> ? R : never

export type GetResult<A> = A extends ReaderFx<any, infer R> ? R : never

export const of = pure

export const ap: <E1, A>(
  fa: ReaderFx<E1, A>,
) => <E2, B>(fab: ReaderFx<E2, Arity1<A, B>>) => ReaderFx<E1 | E2, B> = FxT.ap({
  ...MonadRec,
  ...Apply,
})

export const map: <A, B>(f: Arity1<A, B>) => <E>(fa: ReaderFx<E, A>) => ReaderFx<E, B> = map_

export const chain: <A, E1, B>(
  f: Arity1<A, ReaderFx<E1, B>>,
) => <E2>(fa: ReaderFx<E2, A>) => ReaderFx<E1 | E2, B> = FxT.chain<URI>(MonadRec)

export const fromReader: <E, A>(either: Reader<E, A>) => ReaderFx<E, A> = FxT.liftFx<URI>()

export const toReader: <E, A>(fx: ReaderFx<E, A>) => Reader<E, A> = FxT.toMonad(MonadRec)

export const doReader: <Effects extends Reader<any, any>, R, N = unknown>(
  f: (lift: FxT.LiftFx<URI>) => Generator<Effects, R, N>,
) => ReaderFx<GetRequirements<Effects>, R> = FxT.getDo<URI>()

export type GetReaderRequirements<A> = [A] extends [Reader<infer R, any>] ? R : never
export type GetReaderResult<A> = [A] extends [Reader<any, infer R>] ? R : never
