import { pipe } from 'fp-ts/function'
import { reduce } from 'fp-ts/ReadonlyArray'
import { Lens } from 'monocle-ts'
import { O } from 'ts-toolbelt'

import { FormDataObj } from './FormDataObj'
import { ownKeys } from './reflection'

/**
 * Get all the lens derived from a given recorrd
 */
export function getLensProps<A extends FormDataObj>(value: A): LensPropsOf<A> {
  const lensProp = Lens.fromProp<A>()

  return pipe(
    value,
    ownKeys,
    reduce({} as LensPropsOf<A>, (acc, key) => ({ ...acc, [key]: lensProp(key) })),
  )
}

type LensPropsOf<A extends FormDataObj> = {
  readonly [K in O.RequiredKeys<A>]: Lens<A, A[K]>
}
