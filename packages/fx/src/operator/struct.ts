import { pipe } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'
import { entriesOf } from '../_internal/entriesOf.js'

import { combineAll } from './combine.js'
import { map } from './map.js'

export function struct<Streams extends Readonly<Record<PropertyKey, Fx<any, any, any>>>>(
  streams: Streams,
): Fx<
  Fx.ResourcesOf<Streams[keyof Streams]>,
  Fx.ErrorsOf<Streams[keyof Streams]>,
  {
    readonly [K in keyof Streams]: Fx.OutputOf<Streams[K]>
  }
> {
  return pipe(
    combineAll(
      ...entriesOf(streams).map(([k, fx]) =>
        pipe(
          fx,
          map((a) => [k, a]),
        ),
      ),
    ),
    map(Object.fromEntries),
  )
}
