import { sync } from '@fp/Resume/exports'
import { flow } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'

import { Effect, fromEnv } from './Effect'

/**
 * Convert a Reader<E, A> into an Effect<E, A>
 */
export function fromReader<E, A>(reader: Reader<E, A>): Effect<E, A> {
  return fromEnv(flow(reader, sync))
}
