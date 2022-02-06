import { pipe } from '@/function'
import { Fx, mergeResources, provide } from '@/Fx'

import { idOf } from './idOf'
import { Layer, LayerId } from './Layer'
import { get } from './Layers'

export const compose =
  <R2, A, E2, B>(right: Layer<R2 & A, E2, B>) =>
  <R, E>(left: Layer<R, E, A>): Layer<R & R2, E | E2, A & B> => ({
    id: composeIds(left, right),
    global: left.global && right.global,
    overridable: left.overridable && right.overridable,
    provider: Fx(function* () {
      const a = yield* get(left)
      const b = yield* pipe(right, get, provide(a))

      return mergeResources(a, b)
    }),
  })

export const composeIds = <R, E, A, R2, E2, B>(
  left: Layer<R, E, A>,
  right: Layer<R2, E2, B>,
): LayerId => LayerId(Symbol(idOf(left) + ' => ' + idOf(right)))
