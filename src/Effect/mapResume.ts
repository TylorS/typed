import { flow } from 'fp-ts/function'

import { chainResume } from './chainResume'
import { Async, Resume, Sync, sync } from './Effect'

export function mapResume<A, B>(resume: Sync<A>, f: (value: A) => B): Sync<B>
export function mapResume<A, B>(resume: Async<A>, f: (value: A) => B): Async<B>
export function mapResume<A, B>(resume: Resume<A>, f: (value: A) => B): Resume<B>

export function mapResume<A, B>(resume: Resume<A>, f: (value: A) => B): Resume<B> {
  return chainResume(resume, flow(f, sync))
}
