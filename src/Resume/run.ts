import { Arity1 } from '@fp/common/exports'
import { Disposable } from '@fp/Disposable/exports'

import { Resume } from './Resume'

/**
 * Run a Resume returning a Disposable of the resources created.
 */
export const run = <A>(resume: Resume<A>, f: Arity1<A, Disposable>): Disposable =>
  resume.async ? resume.run(f) : f(resume.value)
