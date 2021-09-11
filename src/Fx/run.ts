import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither'
import { TaskEither } from 'fp-ts/TaskEither'

import { Cause } from '@/Cause'
import { Exit } from '@/Exit'
import { runFiber } from '@/Fiber/runFiber'

import { Fx } from './Fx'

export function runPromise<R>(requirements: R) {
  return async <E, A>(fx: Fx<R, E, A>): Promise<Exit<E, A>> =>
    await pipe(fx, runFiber(requirements)).exit
}

export function toReaderTaskEither<R, E, A>(fx: Fx<R, E, A>): ReaderTaskEither<R, Cause<E>, A> {
  return (r) => async () => await pipe(fx, runFiber(r)).exit
}

export function toTaskEither<R>(requirements: R) {
  return <E, A>(fx: Fx<R, E, A>): TaskEither<Cause<E>, A> => toReaderTaskEither(fx)(requirements)
}
