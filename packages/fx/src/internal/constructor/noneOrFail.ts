import type { Fx } from '@typed/fx/internal/Fx'
import { noneOrFailWith } from '@typed/fx/internal/constructor/noneOrFailWith'
import type { Option } from '@typed/fx/internal/externals'
import { identity } from '@typed/fx/internal/externals'

export const noneOrFail: <A>(option: Option.Option<A>) => Fx<never, A, void> =
  noneOrFailWith(identity)
