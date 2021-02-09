import { Arity1 } from '@fp/lambda'
import { pipe } from 'fp-ts/dist/function'

import { async } from './Async'
import { isSync, Resume } from './Resume'
import { run } from './run'

export const chain = <A, B>(f: Arity1<A, Resume<B>>) => (resume: Resume<A>): Resume<B> =>
  isSync(resume) ? f(resume.resume()) : async((r) => pipe(resume, chain(f), run(r)))
