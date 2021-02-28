import { Arity1 } from '@typed/fp/lambda'
import { Either, isRight, match } from 'fp-ts/dist/Either'
import { constant, flow, pipe } from 'fp-ts/dist/function'

import { chain } from './chain'
import { isSync, Resume } from './Resume'
import { sync } from './Sync'

const of = flow(constant, sync)

export const chainRec = <A, B>(f: Arity1<A, Resume<Either<A, B>>>) => (value: A): Resume<B> => {
  let resume = f(value)

  while (isSync(resume)) {
    const either = resume.resume()

    if (isRight(either)) {
      return pipe(either.right, constant, sync)
    }

    resume = f(either.left)
  }

  // Recursion is okay because Resume SHOULD be asynchronous
  return pipe(resume, chain(match(chainRec(f), of)))
}
