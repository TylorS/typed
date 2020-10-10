import { Arity1 } from '@typed/fp/common/exports'
import { Disposable } from '@typed/fp/Disposable/exports'

import { Resume } from './Resume'

export const run = <A>(resume: Resume<A>, f: Arity1<A, Disposable>): Disposable =>
  resume.async ? resume.run(f) : f(resume.value)
