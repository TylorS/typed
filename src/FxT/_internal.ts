import { doFx } from '@fp/Fx'

import { FxT } from './FxT'

export const chain_ = <A, B>(f: (value: A) => FxT<any, B>) => (fa: FxT<any, A>): FxT<any, B> =>
  doFx(function* () {
    const a = yield* fa

    return yield* f(a)
  })

export const map_ = <A, B>(f: (value: A) => B) => (fa: FxT<any, A>): FxT<any, B> =>
  doFx(function* () {
    return f(yield* fa)
  })
