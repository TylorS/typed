import { Arity1 } from '@typed/fp/common/exports'
import { curry } from '@typed/fp/lambda/exports'

import { Async, async } from './Async'
import { Resume } from './Resume'
import { run } from './run'
import { Sync } from './Sync'

/**
 * Sequence together multiple Resumes.
 */
export const chain = curry(
  <A, B>(f: Arity1<A, Resume<B>>, resume: Resume<A>): Resume<B> => {
    return resume.async ? async((cb) => run(resume, (a) => run(f(a), cb))) : f(resume.value)
  },
) as {
  <A, B>(f: Arity1<A, Sync<B>>, resume: Sync<A>): Sync<B>
  <A, B>(f: Arity1<A, Async<B>>, resume: Async<A>): Async<B>
  <A, B>(f: Arity1<A, Resume<B>>, resume: Resume<A>): Resume<B>

  <A, B>(f: Arity1<A, Sync<B>>): {
    (resume: Sync<A>): Sync<B>
    (resume: Resume<A>): Resume<B>
  }
  <A, B>(f: Arity1<A, Async<B>>): {
    (resume: Async<A>): Async<B>
    (resume: Resume<A>): Resume<B>
  }
  <A, B>(f: Arity1<A, Resume<B>>): (resume: Resume<A>) => Resume<B>
}
