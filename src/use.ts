import { disposeBoth, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { EqStrict } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { not } from 'fp-ts/Predicate'
import * as RA from 'fp-ts/ReadonlyArray'

import { create } from './Adapter'
import { settable } from './Disposable'
import * as E from './Env'
import { alwaysEqualsEq, deepEqualsEq, Eq, neverEqualsEq } from './Eq'
import * as RS from './ReaderStream'
import * as Ref from './Ref'
import * as RefDisposable from './RefDisposable'
import * as RefMapM from './RefMapM'
import * as R from './Resume'
import { delay, SchedulerEnv } from './Scheduler'
import * as S from './Stream'

/**
 * Use Refs to check if a value has changed between invocations
 */
export const useEq = <A = void>(Eq: Eq<A> = deepEqualsEq) => {
  const ref = Ref.make(E.of<O.Option<A>>(O.none), { eq: alwaysEqualsEq })

  return (value: A): E.Env<Ref.Set & Ref.Get, boolean> =>
    pipe(
      E.Do,
      E.bindW('previous', () => Ref.get(ref)),
      E.bindW('changed', ({ previous }) =>
        pipe(
          previous,
          O.matchW(() => true, not(Eq.equals(value))),
          E.of,
        ),
      ),
      E.chainW(({ previous, changed }) =>
        pipe(
          previous,
          O.matchW(
            () => E.of(changed),
            () => pipe(value, O.some, Ref.set(ref), E.constant(changed)),
          ),
        ),
      ),
    )
}

export const useMemo = <E, A, B = void>(env: E.Env<E, A>, Eq: Eq<B> = deepEqualsEq) => {
  const ref = Ref.make(env, { eq: alwaysEqualsEq })
  const changed = useEq(Eq)

  return (value: B) =>
    pipe(
      value,
      changed,
      E.chainFirstW((changed) => (changed ? Ref.update(ref)(() => env) : E.of(null))),
      E.chainW(() => Ref.get(ref)),
    )
}

export const useDisposable = <A = void>(Eq: Eq<A> = deepEqualsEq) => {
  const ref = Ref.make(E.fromIO(disposeNone), { eq: alwaysEqualsEq })
  const changed = useEq(Eq)

  return (f: () => Disposable, value: A): E.Env<Ref.Set & Ref.Get, Disposable> =>
    pipe(
      E.Do,
      E.bindW('changed', () => changed(value)),
      E.bindW('current', () => Ref.get(ref)),
      E.chainW(({ changed, current }) =>
        changed
          ? pipe(
              E.fromIO(() => current.dispose()),
              E.chainW(() => E.fromIO(f)),
              E.chainW((next) =>
                pipe(
                  RefDisposable.add(next),
                  E.map((d) => disposeBoth(d, next)),
                  E.chainW(Ref.set(ref)),
                ),
              ),
            )
          : E.of(current),
      ),
    )
}

export const useEffect = <A = void>(Eq: Eq<A> = deepEqualsEq) => {
  const use = useDisposable(Eq)

  return <E>(env: E.Env<E, any>, value: A) =>
    pipe(
      E.ask<E & SchedulerEnv>(),
      E.chainW((r) =>
        use(
          () =>
            pipe(
              r,
              pipe(
                delay(0),
                E.chainW(() => env),
              ),
              R.exec,
            ),
          value,
        ),
      ),
    )
}

export function useEnvK<A extends ReadonlyArray<any>, E1, B, E2>(
  f: (...args: A) => E.Env<E1, B>,
  onValue: (value: B) => E.Env<E2, any> = E.of,
): E.Env<E1 & E2 & Ref.Refs, (...args: A) => Disposable> {
  return pipe(
    E.Do,
    E.apSW('refDisposable', RefDisposable.get),
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

export const bindEnvK =
  <N extends string, A, Args extends readonly any[], E1, B, E2>(
    name: Exclude<N, keyof A>,
    f: (...args: Args) => E.Env<E1, B>,
    onValue?: (value: B) => E.Env<E2, any>,
  ) =>
  <E3>(
    ma: E.Env<E3, A>,
  ): E.Env<
    E1 & E2 & E3 & Ref.Refs,
    { readonly [K in N | keyof A]: K extends keyof A ? A[K] : () => Disposable }
  > =>
    E.bindW(name, () => useEnvK((...args: Args) => f(...args), onValue))(ma)

export const useReaderStream = <A = void>(Eq: Eq<A> = deepEqualsEq) => {
  const use = useDisposable(Eq)

  return <E, B>(rs: RS.ReaderStream<E, B>, dep: A) =>
    pipe(
      E.ask<E & Ref.Refs & SchedulerEnv>(),
      E.chainW((r) => use(() => rs(r).run(S.createSink(), r.scheduler), dep)),
    )
}

export const useStream = <A = void>(Eq: Eq<A> = deepEqualsEq) => {
  const use = useReaderStream(Eq)

  return <B>(stream: S.Stream<B>, dep: A) => use(() => stream, dep)
}

export const useKeyedRefs = <A>(Eq: Eq<A>) => {
  const ref = RefMapM.kv({ keyEq: Eq, valueEq: EqStrict as Eq<Ref.Refs> })

  const remove = (value: A) =>
    pipe(
      ref.lookup(value),
      E.chainFirstW(
        O.matchW(
          () => E.of(false),
          (refs) => pipe(RefDisposable.dispose, E.useAll(refs), E.constant(true)),
        ),
      ),
    )

  const createRefs = (value: A) =>
    pipe(
      Ref.getRefs,
      E.map((parentRefs) => Ref.refs({ parentRefs })),
      // Ensure removed from RefMap when RefDisposable is disposed of
      E.chainFirstW((refs) =>
        pipe(
          RefDisposable.add({ dispose: () => pipe(refs, remove(value), R.exec) }),
          E.useSome(refs),
        ),
      ),
    )

  return (value: A): E.Env<Ref.Refs, Ref.Refs> => ref.getOrCreate(value, createRefs(value))
}

export const useRefsArray = <A, E, B>(f: (value: A) => E.Env<E, B>, Eq: Eq<A>) => {
  const findRefs = useKeyedRefs(Eq)
  const needsUpdate = Ref.set(Ref.make(E.of(false), { eq: neverEqualsEq }))(true)
  const useRS = useReaderStream()
  const useEff = useEffect()
  const mergeMap = RS.mergeMapWhen(deepEqualsEq as Eq<S.Stream<A>>)((s) =>
    pipe(
      s,
      RS.fromStream,
      RS.switchMapW((a) =>
        pipe(
          a,
          findRefs,
          RS.fromEnv,
          RS.switchMapW((refs) => pipe(Ref.getRefEvents, RS.useSome(refs))),
          RS.tap((x) => console.log(x)),
          RS.chainEnvK(() => needsUpdate),
        ),
      ),
      RefDisposable.disposeOfRefs,
    ),
  )

  const [send, stream] = create(flow(S.keyed(Eq)))

  return (values: readonly A[]): E.Env<E & Ref.Refs & SchedulerEnv, readonly B[]> =>
    pipe(
      values,
      RA.map((a) => pipe(a, f, E.useSomeWith(findRefs(a)))),
      E.zipW,
      E.chainFirstW(() => pipe(stream, RS.fromStream, mergeMap, useRS)),
      E.chainFirstW(() => useEff(E.fromIO(() => send(values)))),
    )
}
