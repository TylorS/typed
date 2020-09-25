import { map, Pure } from '@typed/fp/Effect/exports'
import { UseState } from '@typed/fp/hooks/exports'
import { pipe } from 'fp-ts/function'
import * as RA from 'fp-ts/ReadonlyArray'
import * as R from 'fp-ts/ReadonlyRecord'
import { Lens } from 'monocle-ts'
import { O } from 'ts-toolbelt'

import { applyLens } from './applyLens'

export function getLensPropStates<A extends R.ReadonlyRecord<string, unknown>>(
  state: UseState<A>,
): Pure<LensPropStates<A>> {
  return map(getLensProps(state), state[0])
}

export type LensPropStates<A extends R.ReadonlyRecord<string, unknown>> = {
  readonly [K in O.RequiredKeys<A>]: UseState<A[K]>
}

function getLensProps<A extends R.ReadonlyRecord<string, unknown>>(state: UseState<A>) {
  return (value: A): LensPropStates<A> => {
    const lensProp = Lens.fromProp<A>()
    const apply = applyLens(state)

    return pipe(
      value,
      R.keys,
      RA.reduce({} as LensPropStates<A>, (acc, key) => ({ ...acc, [key]: apply(lensProp(key)) })),
    )
  }
}
