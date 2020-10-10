import { Disposable } from '@typed/fp/Disposable/exports'
import { Either, left, right } from 'fp-ts/Either'
import { flow } from 'fp-ts/function'

import { Async, async } from './Async'

export interface AsyncEither<A, B> extends Async<Either<A, B>> {}

/**
 * Resume an effect asynchronously that can possibly fail.
 */
export const asyncEither = <A, B>(
  run: (left: (value: A) => Disposable, right: (value: B) => Disposable) => Disposable,
): AsyncEither<A, B> => async((cb) => run(flow(left, cb), flow(right, cb)))
