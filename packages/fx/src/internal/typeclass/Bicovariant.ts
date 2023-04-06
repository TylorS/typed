import * as BC from '@effect/data/typeclass/Bicovariant'

import type { FxTypeLambda } from '@typed/fx/internal/Fx'
import { mapBoth } from '@typed/fx/internal/operator/mapBoth'

export const Bicovariant: BC.Bicovariant<FxTypeLambda> = {
  bimap: mapBoth,
}
