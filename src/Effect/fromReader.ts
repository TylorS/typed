import { flow } from 'fp-ts/es6/function'
import { Reader } from 'fp-ts/es6/Reader'

import { Effect, sync } from './Effect'
import { fromEnv } from './fromEnv'

export function fromReader<E, A>(reader: Reader<E, A>): Effect<E, A> {
  return fromEnv(flow(reader, sync))
}
