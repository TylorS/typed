import { pipe } from '@effect/data/Function'

import type { Fx } from '@typed/fx/internal/Fx'
import { switchMap } from '@typed/fx/internal/operator/switchMap'

export const ifFx = <R, E, R2, E2, B, R3, E3, C>(
  self: Fx<R, E, boolean>,
  onTrue: Fx<R2, E2, B>,
  onFalse: Fx<R3, E3, C>,
): Fx<R | R2 | R3, E | E2 | E3, B | C> =>
  pipe(
    self,
    switchMap((b): Fx<R2 | R3, E2 | E3, B | C> => (b ? onTrue : onFalse)),
  )
