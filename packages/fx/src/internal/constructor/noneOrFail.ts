import type { Fx } from '@typed/fx/internal/Fx'
import type { Option } from '@typed/fx/internal/_externals'
import { identity } from '@typed/fx/internal/_externals'
import { noneOrFailWith } from '@typed/fx/internal/constructor/noneOrFailWith'

export const noneOrFail: <A>(option: Option.Option<A>) => Fx<never, A, void> =
  noneOrFailWith(identity)
