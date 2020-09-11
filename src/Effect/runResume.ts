import { Disposable } from '@most/types'
import { Arity1 } from '@typed/fp/common/exports'
import { Resume } from '@typed/fp/Effect/Effect'

/**
 * @since 0.0.1
 */
export const runResume = <A>(resume: Resume<A>, f: Arity1<A, Disposable>): Disposable =>
  resume.async ? resume.run(f) : f(resume.value)
