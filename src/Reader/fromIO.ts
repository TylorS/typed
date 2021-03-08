import { URI, Reader } from 'fp-ts/dist/Reader'
import { IO } from '@typed/fp/IO'
import { identity } from 'fp-ts/dist/function'
import { FromIO2 } from 'fp-ts/dist/FromIO'

export const fromIO: <A, E = never>(io: IO<A>) => Reader<E, A> = identity

export const FromIO: FromIO2<URI> = {
  fromIO,
}
