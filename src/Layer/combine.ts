import { Fx, mergeResources, tuple } from '@/Fx'

import { idOf } from './idOf'
import { Layer, LayerId } from './Layer'
import { get } from './Layers'

export const combine =
  <R2, E2, B>(right: Layer<R2, E2, B>) =>
  <R, E, A>(left: Layer<R, E, A>): Layer<R & R2, E | E2, A & B> => ({
    id: combineIds(left, right),
    global: left.global && right.global,
    overridable: left.overridable && right.overridable,
    provider: Fx(function* () {
      const [a, b] = yield* tuple([get(left), get(right)] as const)

      return mergeResources(a, b)
    }),
  })

export const combineIds = <R, E, A, R2, E2, B>(
  left: Layer<R, E, A>,
  right: Layer<R2, E2, B>,
): LayerId => LayerId(Symbol(idOf(left) + ' & ' + idOf(right)))
