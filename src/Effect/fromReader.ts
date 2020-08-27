import { Reader } from 'fp-ts/es6/Reader'
import { flow } from 'fp-ts/lib/function'

import { Effect, sync } from './Effect'
import { fromEnv } from './fromEnv'

export function fromReader<E, A>(reader: Reader<E, A>): Effect<E, A> {
  return fromEnv(flow(reader, sync))
}
