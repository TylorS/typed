import {
  DeleteKV,
  DeleteKV2,
  DeleteKV3,
  DeleteKV3C,
  DeleteKV4,
  GetKV,
  GetKV2,
  GetKV3,
  GetKV3C,
  GetKV4,
  KV,
  SetKV,
  SetKV2,
  SetKV3,
  SetKV3C,
  SetKV4,
} from '@typed/fp/KV'
import {
  ask,
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { UseSome, UseSome2, UseSome3, UseSome3C, UseSome4 } from '@typed/fp/Provide'
import { WidenI } from '@typed/fp/Widen'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createDeleteKV } from './createDeleteKV'
import { createGetKV } from './createGetKV'
import { createSetKV } from './createSetKV'
import { KvEnv } from './KvEnv'

export function useKV<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F> & UseSome4<F>,
): <S, R, E, A>(
  hkt: Kind4<F, S, WidenI<GetKV4<F> | SetKV4<F> | DeleteKV4<F> | KvEnv<F, any, any> | R>, E, A>,
) => Kind4<F, S, WidenI<KvEnv<F, any, any> | R>, E, A>

export function useKV<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F> & UseSome3<F>,
): <R, E, A>(
  hkt: Kind3<F, WidenI<GetKV3<F> | SetKV3<F> | DeleteKV3<F> | KvEnv<F, any, any> | R>, E, A>,
) => Kind3<F, WidenI<KvEnv<F, any, any> | R>, E, A>

export function useKV<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E> & UseSome3C<F, E>,
): <R, A>(
  hkt: Kind3<
    F,
    WidenI<GetKV3C<F, E> | SetKV3C<F, E> | DeleteKV3C<F, E> | KvEnv<F, any, any> | R>,
    E,
    A
  >,
) => Kind3<F, WidenI<KvEnv<F, any, any> | R>, E, A>

export function useKV<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F> & UseSome2<F>,
): <E, A>(
  hkt: Kind2<F, WidenI<GetKV2<F> | SetKV2<F> | DeleteKV2<F> | KvEnv<F, any, any> | E>, A>,
) => Kind2<F, WidenI<KvEnv<F, any, any> | E>, A>

export function useKV<F>(
  M: MonadReader<F> & FromIO<F> & UseSome<F>,
): <E, A>(
  hkt: HKT2<F, WidenI<GetKV<F> | SetKV<F> | DeleteKV<F> | KvEnv<F, any, any> | E>, A>,
) => HKT2<F, WidenI<KvEnv<F, any, any> | E>, A>

export function useKV<F>(M: MonadReader<F> & FromIO<F> & UseSome<F>) {
  const getKV = createGetKV(M)
  const setKV = createSetKV(M)
  const deleteKV = createDeleteKV(M)
  const get = ask(M)

  return <E, A>(
    hkt: HKT2<F, WidenI<GetKV<F> | SetKV<F> | DeleteKV<F> | KvEnv<F, any, any> | E>, A>,
  ) =>
    pipe(
      get<KvEnv<F, any, any>>(),
      M.chain((kvEnv) => {
        const provideKvEnv = M.useSome(kvEnv)
        const provide = M.useSome<GetKV<F> & SetKV<F> & DeleteKV<F>>({
          getKV: (kv) => provideKvEnv(getKV(kv)),
          setKV: <A>(value: A) => <K, E>(kv: KV<F, K, E, A>) => provideKvEnv(setKV(value)(kv)),
          deleteKV: (x) => pipe(deleteKV(x), M.useSome(kvEnv)),
        })

        return pipe(hkt, provide, provideKvEnv)
      }),
    )
}
