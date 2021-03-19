import { Eq } from '@typed/fp/Eq'
import * as KV from '@typed/fp/KV'
import { WidenI } from '@typed/fp/Widen'
import { Option } from 'fp-ts/dist/Option'
import { FromReader, Functor, Reader, URI } from 'fp-ts/dist/Reader'

import { MonadReader } from './MonadReader'

export interface ReaderKV<K, E, A> extends KV.KV2<URI, K, E, A> {}

export const createKV: <K, E, A>(
  key: K,
  initial: Reader<E, A>,
  eq?: Eq<A>,
) => ReaderKV<K, E, A> = KV.createKV<URI>()

export const fromKey: <A>(
  eq?: Eq<A>,
) => <K extends PropertyKey>(key: K) => ReaderKV<K, Readonly<Record<K, A>>, A> = KV.fromKey({
  ...FromReader,
  ...Functor,
})

export const deleteKV: <K, E, A>(
  kv: ReaderKV<K, E, A>,
) => Reader<WidenI<E | KV.DeleteKV2<URI>>, Option<A>> = KV.deleteKV(MonadReader)

export const dep: <A>() => <K extends PropertyKey>(
  key: K,
) => Reader<WidenI<Readonly<Record<K, A>> | KV.GetKV2<URI>>, A> = KV.dep(MonadReader)

export const getKV: <K, E, A>(
  kv: ReaderKV<K, E, A>,
) => Reader<WidenI<E | KV.GetKV2<URI>>, A> = KV.getKV(MonadReader)

export const modifyKV: <A>(
  f: (value: A) => A,
) => <K, E>(
  kv: ReaderKV<K, E, A>,
) => Reader<WidenI<E | KV.SetKV2<URI> | KV.GetKV2<URI>>, A> = KV.modifyKV(MonadReader)

export const op: <Op>() => <K extends PropertyKey>(
  key: K,
) => <E, A>(
  f: (op: Op) => Reader<E, A>,
) => Reader<WidenI<E | Readonly<Record<K, Op>> | KV.GetKV2<URI>>, A> = KV.op(MonadReader)

export const setKV: <A>(
  value: A,
) => <K, E>(kv: ReaderKV<K, E, A>) => Reader<WidenI<E | KV.SetKV2<URI>>, A> = KV.setKV(MonadReader)
