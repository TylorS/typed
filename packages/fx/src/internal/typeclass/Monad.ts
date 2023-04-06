import type * as M from '@effect/data/typeclass/Monad'

import type { FxTypeLambda } from '@typed/fx/internal/Fx'
import { FlatMap } from '@typed/fx/internal/typeclass/FlatMap'
import { Pointed } from '@typed/fx/internal/typeclass/Pointed'

export const Monad: M.Monad<FxTypeLambda> = {
  ...Pointed,
  ...FlatMap,
}
