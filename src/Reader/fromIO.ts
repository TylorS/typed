import { IO } from '@typed/fp/IO'
import { FromIO2 } from 'fp-ts/dist/FromIO'
import { identity } from 'fp-ts/dist/function'
import { Reader, URI } from 'fp-ts/dist/Reader'

export const fromIO: <A, E = never>(io: IO<A>) => Reader<E, A> = identity

export const FromIO: FromIO2<URI> = {
  fromIO,
}
