import { Arity1 } from '@typed/fp/common/exports'

import { Async, async, Resume, Sync } from './Effect'
import { runResume } from './runResume'

/**
 * @internal
 * @since 0.0.1
 */
export function chainResume<A, B>(resume: Sync<A>, f: Arity1<A, Sync<B>>): Sync<B>
export function chainResume<A, B>(resume: Async<A>, f: Arity1<A, Async<B>>): Async<B>
export function chainResume<A, B>(resume: Resume<A>, f: Arity1<A, Resume<B>>): Resume<B>

export function chainResume<A, B>(resume: Resume<A>, f: Arity1<A, Resume<B>>): Resume<B> {
  return resume.async
    ? async((cb) => runResume(resume, (a) => runResume(f(a), cb)))
    : f(resume.value)
}
