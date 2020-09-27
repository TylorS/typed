import { pipe } from 'fp-ts/function'
import { reduce } from 'fp-ts/ReadonlyArray'
import { Lens } from 'monocle-ts'
import { O } from 'ts-toolbelt'

import { ownKeys } from './reflection'

export function getLensProps<A extends Readonly<Record<PropertyKey, any>>>(
  value: A,
): LensPropsOf<A> {
  const lensProp = Lens.fromProp<A>()

  return pipe(
    value,
    ownKeys,
    reduce({} as LensPropsOf<A>, (acc, key) => ({ ...acc, [key]: lensProp(key) })),
  )
}

type LensPropsOf<A extends Readonly<Record<PropertyKey, any>>> = {
  readonly [K in O.RequiredKeys<A>]: Lens<A, A[K]>
}
