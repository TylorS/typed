import { settable } from '@fp/Disposable'
import * as E from '@fp/Env'
import { deepEqualsEq, Eq } from '@fp/Eq'
import { pipe } from '@fp/function'
import { useRef } from '@fp/hooks'
import * as O from '@fp/Option'
import * as Ref from '@fp/Ref'
import * as RefDisposable from '@fp/RefDisposable'
import * as R from '@fp/Resume'
import { delay, SchedulerEnv } from '@fp/Scheduler'
import { Disposable } from '@fp/Stream'
import { disposeBoth, disposeNone } from '@most/disposable'
import { not } from 'fp-ts/Predicate'

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
    E.bindW('changed', () => useEq(dep, eq)),
    E.bindW('ref', () => useRef(env)),
    E.chainFirstW(({ ref, changed }) => (changed ? ref.update(() => env) : E.of(null))),
    E.chainW(({ ref }) => ref.get),
  )

/**
 * Execute an Env using a dependency to track when to run an update. Without
 * providing a dep your effect will only run once. Your effect will be added
 * a delay(0) to ensure it runs in the next event loop.
 */
export const useEffect = <E, A, B>(
  effect: E.Env<E, A>,
  dep: B = null as any as B,
  eq: Eq<B> = deepEqualsEq,
) =>
  pipe(
    E.Do,
    E.bindW('changed', () => useEq(dep, eq)),
    E.bindW('ref', () => useRef(E.fromIO(disposeNone))),
    E.bindW('current', ({ ref }) => ref.get),
    E.bindW('refDisposable', () => RefDisposable.get),
    E.bindW('requirements', () => E.ask<E & SchedulerEnv>()),
    E.chainFirstW(({ changed, current, ref, requirements }) =>
      changed
        ? pipe(
            E.fromIO(() => {
              current.dispose() // Dispose of the current

              // Execute our effect
              return pipe(
                requirements,
                pipe(
                  delay(0),
                  E.chainW(() => effect),
                ),
                R.exec,
              )
            }),
            E.chainW((next) =>
              // Keep track of all the resources
              pipe(
                RefDisposable.add(next),
                E.map((d) => disposeBoth(d, next)),
                E.chainW(ref.set),
              ),
            ),
          )
        : E.of(null),
    ),
    E.chainW(({ ref }) => ref.get),
  )

/**
 * Converts an Env-returning function into a Disposable returning function
 * by supplying the surrounding environment and tracking the Disposable using
 * RefDisposable. This can be useful when converting workflows into something that
 * can be called in an event handler.
 */
export function useOp<A extends ReadonlyArray<any>, E1, B, E2>(
  f: (...args: A) => E.Env<E1, B>,
  onValue: (value: B) => E.Env<E2, any> = E.of,
): E.Env<E1 & E2 & Ref.Refs, (...args: A) => Disposable> {
  return pipe(
    E.Do,
    E.bindW('refDisposable', () => RefDisposable.get),
    E.apSW('resumeF', E.toResumeK(f)),
    E.apSW('resumeV', E.toResumeK(onValue)),
    E.map(({ resumeF, resumeV, refDisposable }) => (...args: A) => {
      const d2Lazy = settable()
      const d1 = pipe(
        resumeF(...args),
        R.chain(resumeV),
        R.start(() => d2Lazy.dispose()),
      )
      const d2 = refDisposable.addDisposable(d1)

      d2Lazy.addDisposable(d2)

      return disposeBoth(d1, d2Lazy)
    }),
  )
}
