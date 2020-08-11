import { Disposable } from '@most/types'
import { Arity1 } from '@typed/fp/common'
import { Resume } from './Effect'

export const runResume = <A>(resume: Resume<A>, f: Arity1<A, Disposable>): Disposable =>
  resume.async ? resume.run(f) : f(resume.value)
