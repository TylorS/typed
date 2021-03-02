import { Ask, Env, Functor, MonadAsk, URI } from '@typed/fp/Env'
import {
  createShared as createShared_,
  deleteShared as deleteShared_,
  DeleteShared2,
  fromKey as fromKey_,
  getShared as getShared_,
  GetShared2,
  modifyShared as modifyShared_,
  setShared as setShared_,
  SetShared2,
  Shared2,
} from '@typed/fp/Shared'
import { WidenI } from '@typed/fp/Widen'
import { Eq } from 'fp-ts/dist/Eq'
import { Option } from 'fp-ts/dist/Option'

export interface EnvShared<K, E, A> extends Shared2<URI, K, E, A> {}

export const createShared: <K, E, A>(
  key: K,
  initial: Env<E, A>,
  eq?: Eq<A>,
) => EnvShared<K, E, A> = createShared_<URI>()

export const modifyShared: <A>(
  f: (value: A) => A,
) => <K, E>(
  shared: EnvShared<K, E, A>,
) => Env<WidenI<E | SetShared2<URI> | GetShared2<URI>>, A> = modifyShared_(MonadAsk)

export const getShared: <K, E, A>(
  shared: EnvShared<K, E, A>,
) => Env<WidenI<E | GetShared2<URI>>, A> = getShared_(MonadAsk)

export const setShared: <A>(
  value: A,
) => <K, E>(shared: EnvShared<K, E, A>) => Env<WidenI<E | SetShared2<URI>>, A> = setShared_(
  MonadAsk,
)

export const deleteShared: <K, E, A>(
  shared: EnvShared<K, E, A>,
) => Env<WidenI<E | DeleteShared2<URI>>, Option<A>> = deleteShared_(MonadAsk)

export const fromKey: <A>(
  eq?: Eq<A> | undefined,
) => <K extends string | number | symbol>(
  key: K,
) => EnvShared<K, Readonly<Record<K, A>>, A> = fromKey_({ ...Ask, ...Functor })
