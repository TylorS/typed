import * as E from '@fp/Env'
import { deepEqualsEq, Eq } from '@fp/Eq'
import { pipe } from '@fp/function'
import * as O from '@fp/Option'
import { not } from 'fp-ts/Predicate'

import { useRef } from './hooks'
import * as Ref from './Ref'

/**
 * @typed/fp/use is a collection of functions built atop of useRef + hooks. Anytime they
 * are used they are subject to the "rules of hooks" where order matters and you are not
 * able to nest hooks inside of one another without special consideration (e.g. using hooks inside of useMemo).
 */

/**
 * Use an Eq instance to track if a value has changed over time.
 */
export const useEq = <A>(value: A, Eq: Eq<A>, firstRun = true): E.Env<Ref.Refs, boolean> =>
  pipe(
    E.Do,
    E.bindW('ref', () => useRef(E.of<O.Option<A>>(O.none))),
    E.bindW('previous', ({ ref }) => ref.get),
    E.bindW('changed', ({ previous }) =>
      pipe(
        previous,
        O.matchW(() => firstRun, not(Eq.equals(value))),
        E.of,
      ),
    ),
    E.chainW(({ previous, changed, ref }) =>
      pipe(
        previous,
        O.matchW(
          () => E.of(changed),
          () => pipe(value, O.some, ref.set, E.constant(changed)),
        ),
      ),
    ),
  )

/**
 * Memoize the value of a computation using a dependency to track when to run an update. Without
 * providing a dep your computation will only run once.
 */
export const useMemo = <E, A, B = null>(
  env: E.Env<E, A>,
  dep: B = null as any as B,
  eq: Eq<B> = deepEqualsEq,
): E.Env<E & Ref.Refs, A> =>
  pipe(
    E.Do,
    E.apSW('changed', useEq(dep, eq)),
    E.apSW('ref', useRef(env)),
    E.chainFirstW(({ ref, changed }) => (changed ? ref.update(() => env) : E.of(null))),
    E.chainW(({ ref }) => ref.get),
  )
