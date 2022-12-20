import { map } from '@effect/io/Cause'

import { Fx } from '../Fx.js'

import { mapCause } from './mapCause.js'

export function mapError<E, E2>(f: (e: E) => E2): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A> {
  return mapCause(map(f))
}
