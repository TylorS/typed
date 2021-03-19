import {
  DeleteKV,
  DeleteKV2,
  DeleteKV3,
  DeleteKV4,
  GetKV,
  GetKV2,
  GetKV3,
  GetKV4,
  SetKV,
  SetKV2,
  SetKV3,
  SetKV4,
} from '@typed/fp/KV'
import { MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import { Namespace } from '@typed/fp/Namespace'
import { Provider2, Provider3, Provider4, ProvideSome, ProvideSome2 } from '@typed/fp/Provide'
import { ProvideSome3, ProvideSome4 } from '@typed/fp/Provide/Provide'
import { WidenI } from '@typed/fp/Widen'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createDeleteKV } from './createDeleteKv'
import { createGetKV } from './createGetKv'
import { createSetKV } from './createSetKV'
import { GlobalNamespace } from '../Global/Global'
import { createShared, Shared } from './Shared'

export function provideShared<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F> & ProvideSome2<F>,
): (
  options: RuntimeOptions<F>,
) => Provider2<F, GetKV2<F> & SetKV2<F> & DeleteKV2<F> & Shared<F>, never>

export function provideShared<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F> & ProvideSome3<F>,
): <E = never>(
  options: RuntimeOptions<F>,
) => Provider3<F, GetKV3<F> & SetKV3<F> & DeleteKV3<F> & Shared<F>, never, E>

export function provideShared<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F> & ProvideSome4<F>,
): <R = never, E = never>(
  options: RuntimeOptions<F>,
) => Provider4<F, GetKV4<F> & SetKV4<F> & DeleteKV4<F> & Shared<F>, never, R, E>

export function provideShared<F>(
  M: MonadReader<F> & FromIO<F> & ProvideSome<F>,
): (
  options: RuntimeOptions<F>,
) => <E, A>(
  hkt: HKT2<F, WidenI<(GetKV<F> & SetKV<F> & DeleteKV<F> & Shared<F>) | E>, A>,
) => HKT2<F, E, A>

export function provideShared<F>(M: MonadReader<F> & FromIO<F> & ProvideSome<F>) {
  const getKV = createGetKV(M)
  const setKV = createSetKV(M)
  const deleteKV = createDeleteKV(M)

  return (options: RuntimeOptions<F>) => {
    const { namespace = GlobalNamespace, runtimeEnv = createShared<F>(namespace) } = options
    const runtime: Shared<F> & GetKV<F> & SetKV<F> & DeleteKV<F> = {
      ...runtimeEnv,
      getKV: (kv) => pipe(kv, getKV, M.provideSome(runtimeEnv)),
      setKV: (value) => (kv) => pipe(kv, setKV(value), M.provideSome(runtimeEnv)),
      deleteKV: (kv) => pipe(kv, deleteKV, M.provideSome(runtimeEnv)),
    }

    return <E, A>(
      hkt: HKT2<F, WidenI<(GetKV<F> & SetKV<F> & DeleteKV<F> & Shared<F>) | E>, A>,
    ): HKT2<F, E, A> => M.provideSome(runtime)(hkt)
  }
}

export type RuntimeOptions<F> = {
  readonly namespace?: Namespace
  readonly runtimeEnv?: Shared<F>
}
