import { Eq } from '@typed/fp/Eq'
import * as KV from '@typed/fp/KV'
import { WidenI } from '@typed/fp/Widen'
import { Option } from 'fp-ts/dist/Option'

import { Env } from './Env'
import { FromReader, Functor, MonadReader, URI } from './fp-ts'

export interface EnvKV<K, E, A> extends KV.KV2<URI, K, E, A> {}

export const createKV: <K, E, A>(
  key: K,
  initial: Env<E, A>,
  eq?: Eq<A>,
) => EnvKV<K, E, A> = KV.createKV<URI>()

export const fromKey: <A>(
  eq?: Eq<A>,
) => <K extends PropertyKey>(key: K) => EnvKV<K, Readonly<Record<K, A>>, A> = KV.fromKey({
  ...FromReader,
  ...Functor,
})

export const deleteKV: <K, E, A>(
  kv: EnvKV<K, E, A>,
) => Env<WidenI<E | KV.DeleteKV2<URI>>, Option<A>> = KV.deleteKV(MonadReader)

export const dep: <A>() => <K extends PropertyKey>(
  key: K,
) => Env<WidenI<Readonly<Record<K, A>> | KV.GetKV2<URI>>, A> = KV.dep(MonadReader)

export const getKV: <K, E, A>(kv: EnvKV<K, E, A>) => Env<WidenI<E | KV.GetKV2<URI>>, A> = KV.getKV(
  MonadReader,
)

export const modifyKV: <A>(
  f: (value: A) => A,
) => <K, E>(
  kv: EnvKV<K, E, A>,
) => Env<WidenI<E | KV.SetKV2<URI> | KV.GetKV2<URI>>, A> = KV.modifyKV(MonadReader)

export const op: <Op>() => <K extends PropertyKey>(
  key: K,
) => <E, A>(
  f: (op: Op) => Env<E, A>,
) => Env<WidenI<E | Readonly<Record<K, Op>> | KV.GetKV2<URI>>, A> = KV.op(MonadReader)

export const setKV: <A>(
  value: A,
) => <K, E>(kv: EnvKV<K, E, A>) => Env<WidenI<E | KV.SetKV2<URI>>, A> = KV.setKV(MonadReader)
