import { Arity1 } from '@typed/fp/common'
import { async, Resume } from '@typed/fp/Effect/Effect'
import { runResume } from '@typed/fp/Effect/runResume'

/**
 * @internal
 * @since 0.0.1
 */
export const chainResume = <A, B>(resume: Resume<A>, f: Arity1<A, Resume<B>>): Resume<B> =>
  resume.async ? async((cb) => runResume(resume, (a) => runResume(f(a), cb))) : f(resume.value)
