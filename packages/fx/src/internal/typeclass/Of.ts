import * as O from '@effect/data/typeclass/Of'

import type { Fx, FxTypeLambda } from '@typed/fx/internal/Fx'
import { succeed } from '@typed/fx/internal/constructor/succeed'

export const Of: O.Of<FxTypeLambda> = {
  of: succeed,
}

export const unit: Fx.Succeed<void> = O.unit(Of)<never, never, void>()
