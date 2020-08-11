import { Arity1 } from '@typed/fp/common'
import { async, Resume } from './Effect'
import { runResume } from './runResume'

export const chainResume = <A, B>(resume: Resume<A>, f: Arity1<A, Resume<B>>): Resume<B> =>
  async((cb) => runResume(resume, (a) => runResume(f(a), cb)))
