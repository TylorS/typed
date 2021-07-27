import { disposeBoth, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { EqStrict } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { not } from 'fp-ts/Predicate'

import { settable } from './Disposable'
import * as E from './Env'
import { alwaysEqualsEq, deepEqualsEq, Eq } from './Eq'
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
  const ref = Ref.make(E.of<O.Option<A>>(O.none), {
    eq: alwaysEqualsEq,
    id: Symbol('useEq::Previous'),
  })

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
  const ref = Ref.make(env, { eq: alwaysEqualsEq, id: Symbol('useMemo::Value') })
  const changed = useEq(Eq)
  const updateRef = Ref.update(ref)(() => env)

  return (value: B) =>
    pipe(
      value,
      changed,
      E.chainFirstW((changed) => (changed ? updateRef : E.of(null))),
      E.chainW(() => Ref.get(ref)),
    )
}

export const useDisposable = <A = void>(Eq: Eq<A> = deepEqualsEq, switchLatest = false) => {
  const ref = Ref.make(E.fromIO(disposeNone), {
    eq: alwaysEqualsEq,
    id: Symbol('useDisposable::Disposable'),
  })
  const changed = useEq(Eq)

  return (f: () => Disposable, value: A): E.Env<Ref.Set & Ref.Get, Disposable> =>
    pipe(
      E.Do,
      E.bindW('changed', () => changed(value)),
      E.bindW('current', () => Ref.get(ref)),
      E.chainW(({ changed, current }) =>
        changed
          ? pipe(
              E.fromIO(() => (switchLatest ? current.dispose() : null)),
              E.chainW(() => E.fromIO(f)),
              E.chainW((next) =>
                pipe(
                  next,
                  RefDisposable.add,
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

export const useWithPrevious = <A>() => {
  const previousRef = Ref.make(E.of<O.Option<A>>(O.none), {
    eq: alwaysEqualsEq,
    id: Symbol(`useWithPrevious::Previous`),
  })

  return <B>(f: (previous: O.Option<A>, value: A) => B, value: A) =>
    pipe(
      previousRef,
      Ref.get,
      E.map((previous) => f(previous, value)),
      E.chainFirstW(() => pipe(value, O.some, Ref.set(previousRef))),
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

export const useReaderStream = <A = void, B = unknown>(
  Eq: Eq<A> = deepEqualsEq,
  valueEq: Eq<B> = deepEqualsEq,
) => {
  const use = useDisposable(Eq)
  const ref = Ref.make(E.of<O.Option<B>>(O.none), { eq: O.getEq(valueEq) })

  return <E, C extends B>(
    rs: RS.ReaderStream<E, C>,
    dep: A,
  ): E.Env<E & Ref.Refs & SchedulerEnv, O.Option<C>> =>
    pipe(
      E.ask<E & Ref.Refs & SchedulerEnv>(),
      E.chainW((r) =>
        use(
          () =>
            rs(r).run(
              S.createSink({
                event: (_, value: C) => pipe(value, O.some, Ref.set(ref), E.execWith(r)),
              }),
              r.scheduler,
            ),
          dep,
        ),
      ),
      E.chainW(() => Ref.get(ref) as E.Env<Ref.Refs, O.Option<C>>),
    )
}

export const useStream = <A = void>(Eq: Eq<A> = deepEqualsEq) => {
  const use = useReaderStream(Eq)

  return <B>(stream: S.Stream<B>, dep: A) => use(() => stream, dep)
}

export const useKeyedRefs = <A>(Eq: Eq<A>) => {
  const refs = pipe(
    Ref.create(
      E.fromIO(() => new Map<A, Ref.Refs>()),
      { eq: alwaysEqualsEq },
    ),
    RefMapM.create(Eq, EqStrict as Eq<Ref.Refs>),
  )

  return pipe(
    E.Do,
    E.apSW('parentRefs', Ref.getRefs),
    E.bindW('createRefs', ({ parentRefs }) =>
      E.of((value: A) => {
        const r = Ref.refs({ parentRefs })

        return pipe(refs.upsertAt(value, r), E.constant(r), E.useSome(parentRefs))
      }),
    ),
    E.bindW('findRefs', ({ createRefs, parentRefs }) =>
      E.of((value: A) => pipe(refs.getOrCreate(value, createRefs(value)), E.useSome(parentRefs))),
    ),
    E.bindW('deleteRefs', ({ parentRefs }) =>
      E.of(
        (value: A): S.Disposable => ({
          dispose: () =>
            pipe(
              parentRefs,
              refs.deleteAt(value),
              R.chain(() => RefDisposable.dispose(parentRefs)),
              R.exec,
            ),
        }),
      ),
    ),
    E.map(({ findRefs, deleteRefs }) => ({ findRefs, deleteRefs } as const)),
  )
}

export const useRefsStream = <A, E1, B>(f: (value: A) => RS.ReaderStream<E1, B>, Eq: Eq<A>) => {
  const use = RS.fromEnv(useKeyedRefs(EqStrict as Eq<S.Stream<A>>))
  const mergeMap = RS.mergeMapWhen(EqStrict as Eq<S.Stream<A>>)

  return <E2>(
    stream: RS.ReaderStream<E2, readonly A[]>,
  ): RS.ReaderStream<E1 & E2 & Ref.Refs, readonly B[]> =>
    pipe(
      use,
      RS.switchMapW(({ findRefs, deleteRefs }) =>
        pipe(
          stream,
          RS.keyed(Eq),
          mergeMap((s) =>
            pipe(
              s,
              RS.fromStream,
              RS.switchMapW(f),
              RS.onDispose(deleteRefs(s)),
              RS.useSomeWith(RS.fromEnv(findRefs(s))),
            ),
          ),
        ),
      ),
    )
}

export const useRefs = <A, E1, B>(f: (value: A) => E.Env<E1, B>, Eq: Eq<A>) =>
  useRefsStream(flow(f, Ref.sample), Eq)
