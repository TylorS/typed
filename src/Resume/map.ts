import { curry } from '@typed/fp/lambda/exports'
import { flow } from 'fp-ts/function'

import { Async } from './Async'
import { chain } from './chain'
import { Resume } from './Resume'
import { Sync, sync } from './Sync'

/**
 * Apply a function to a Resume's valeu.
 */
export const map = curry(
  <A, B>(f: (value: A) => B, resume: Resume<A>): Resume<B> => chain(flow(f, sync), resume),
) as {
  <A, B>(f: (value: A) => B, resume: Sync<A>): Sync<B>
  <A, B>(f: (value: A) => B, resume: Async<A>): Async<B>
  <A, B>(f: (value: A) => B, resume: Resume<A>): Resume<B>

  <A, B>(f: (value: A) => B): {
    (resume: Sync<A>): Sync<B>
    (resume: Async<A>): Async<B>
    (resume: Resume<A>): Resume<B>
  }
}
