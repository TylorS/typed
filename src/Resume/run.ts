import { Arity1 } from '@fp/lambda'
import { Disposable } from '@most/types'

import { isAsync, Resume } from './Resume'

export const run = <A>(f: Arity1<A, Disposable>) => (resume: Resume<A>): Disposable =>
  isAsync(resume) ? resume.resume(f) : f(resume.resume())
