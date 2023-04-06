import type * as P from '@effect/data/typeclass/Pointed'

import type { FxTypeLambda } from '@typed/fx/internal/Fx'
import { Covariant } from '@typed/fx/internal/typeclass/Covariant'
import { Of } from '@typed/fx/internal/typeclass/Of'

export const Pointed: P.Pointed<FxTypeLambda> = {
  ...Of,
  ...Covariant,
}
