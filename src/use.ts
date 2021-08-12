/**
 * @typed/fp/use is the only non-referentially transparent module in @typed/fp. It is built atop
 * of [Ref](./Ref.ts.md) to enable many common workflows. If you're coming from a React background, it is
 * pretty similar to hooks, but the only constraint is that is should be declared once at the top of the scope of your module.
 * @since 0.11.0
 */
import { disposeBoth, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { flow, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { not } from 'fp-ts/Predicate'

import * as E from './Env'
import { alwaysEqualsEq, deepEqualsEq, Eq, EqStrict } from './Eq'
import * as KV from './KV'
import * as RS from './ReaderStream'
import * as Ref from './Ref'
import * as RefDisposable from './RefDisposable'
import * as R from './Resume'
import { delay, SchedulerEnv } from './Scheduler'
import * as S from './Stream'

/**
 * Use Refs to check if a value has changed between invocations
 * @since 0.11.0
 * @category Constructor
 */
export const defaultOptionRef = <A>() =>
  Ref.fromKV(KV.make(E.of<O.Option<A>>(O.none), alwaysEqualsEq))

/**
 * Use Refs to check if a value has changed between invocations
 * @since 0.11.0
 * @category Combinator
 */
export function useEqWith<E, A = void>(ref: Ref.Ref<E, O.Option<A>>) {
  return (Eq: Eq<A> = deepEqualsEq, initial = true) =>
    (value: A): E.Env<E, boolean> =>
      pipe(
        E.Do,
        E.bindW('previous', () => ref.get),
        E.bindW('changed', ({ previous }) =>
          pipe(
            previous,
            O.matchW(() => initial, not(Eq.equals(value))),
            E.of,
          ),
        ),
        E.chainW(({ previous, changed }) =>
          pipe(
            previous,
            O.matchW(
              () => E.of(changed),
              () => pipe(value, O.some, ref.set, E.constant(changed)),
            ),
          ),
        ),
      )
}

/**
 * Use Refs to check if a value has changed between invocations
 * @since 0.11.0
 * @category Combinator
 */
export const useEq = <A>(Eq: Eq<A> = deepEqualsEq, initial = true) =>
  useEqWith(defaultOptionRef<A>())(Eq, initial)

/**
 * @since 0.11.0
 * @category Options
 */
export type UseMemoWithOptions<E1, A, E2, B> = {
  readonly currentValue: Ref.Ref<E1, A>
  readonly changed: Ref.Ref<E2, O.Option<B>>
}

/**
 * @since 0.11.0
 * @category Use
 */
export const useMemoWith =
  <E1, A, E2, B>(options: UseMemoWithOptions<E1, A, E2, B>) =>
  <E2>(env: E.Env<E2, A>, Eq: Eq<B> = deepEqualsEq) => {
    const changed = pipe(Eq, useEqWith(options.changed))
    const updateRef = options.currentValue.update(() => env)

    return flow(
      changed,
      E.chainFirstW((changed) => (changed ? updateRef : E.of(null))),
      E.chainW(() => options.currentValue.get),
    )
  }

/**
 * @since 0.11.0
 * @category Use
 */
export const useMemo = <E, A, B>(env: E.Env<E, A>, Eq: Eq<B> = deepEqualsEq) =>
  useMemoWith({
    currentValue: Ref.fromKV(KV.make(env, { ...alwaysEqualsEq, key: Symbol('UseMemo') })),
    changed: defaultOptionRef<B>(),
  })(env, Eq)

/**
 * @since 0.11.0
 * @category Options
 */
export type UseDisposableWithOptions<E1, E2, A> = {
  readonly disposable: Ref.Ref<E1, Disposable>
  readonly changed: Ref.Ref<E2, O.Option<A>>
}

/**
 * @since 0.11.0
 * @category Use
 */
export const useDisposableWith =
  <E1, E2, A = void>(options: UseDisposableWithOptions<E1, E2, A>) =>
  (Eq: Eq<A> = deepEqualsEq, switchLatest = false) => {
    const changed = useEqWith(options.changed)(Eq)

    return (f: () => Disposable, value: A): E.Env<E1 & E2 & KV.Env<symbol>, Disposable> =>
      pipe(
        E.Do,
        E.bindW('changed', () => changed(value)),
        E.bindW('current', () => options.disposable.get),
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
                    E.chainW((a) => options.disposable.set(a)),
                  ),
                ),
              )
            : E.of(current),
        ),
      )
  }

const defaultDisposableRefs = <A>() => ({
  disposable: Ref.fromKV(KV.make(E.fromIO(disposeNone))),
  changed: defaultOptionRef<A>(),
})

/**
 * @since 0.11.0
 * @category Use
 */
export const useDisposable = <A>(Eq: Eq<A> = deepEqualsEq, switchLatest = false) =>
  useDisposableWith(defaultDisposableRefs<A>())(Eq, switchLatest)

/**
 * @since 0.11.0
 * @category Use
 */
export const useEffectWith = <E1, E2, A = void>(options: UseDisposableWithOptions<E1, E2, A>) => {
  const useD = useDisposableWith(options)

  return (Eq: Eq<A> = deepEqualsEq, switchLatest = false) => {
    const use = useD(Eq, switchLatest)

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
}

/**
 * @since 0.11.0
 * @category Use
 */
export const useWithPrevious = <E, A>(ref: Ref.Ref<E, O.Option<A>>) => {
  return <B>(f: (previous: O.Option<A>, value: A) => B, value: A) =>
    pipe(
      ref.get,
      E.map((previous) => f(previous, value)),
      E.chainFirstW(() => pipe(value, O.some, ref.set)),
    )
}

/**
 * Helps you to convert a Kliesli arrow of an Env into a function to
 * a Disposable. Useful for UIs where you need to provide onClick={fn}
 * style handlers.
 * @since 0.11.0
 * @category Use
 */
export function useEnvK<A extends ReadonlyArray<any>, E1, B, E2>(
  f: (...args: A) => E.Env<E1, B>,
  onValue: (value: B) => E.Env<E2, any> = E.of,
): E.Env<E1 & E2 & KV.Env<symbol>, (...args: A) => Disposable> {
  return pipe(
    E.Do,
    E.apSW('refDisposable', RefDisposable.get),
    E.apSW('resumeF', E.toResumeK(f)),
    E.apSW('resumeV', E.toResumeK(onValue)),
    E.map(({ resumeF, resumeV, refDisposable }) => (...args: A) => {
      const d1 = pipe(resumeF(...args), R.chain(resumeV), R.exec)
      const d2 = refDisposable.addDisposable(d1)

      return disposeBoth(d1, d2)
    }),
  )
}

/**
 * @since 0.11.0
 * @category Use
 */
export const bindEnvK =
  <N extends string, A, Args extends readonly any[], E1, B, E2>(
    name: Exclude<N, keyof A>,
    f: (...args: Args) => E.Env<E1, B>,
    onValue?: (value: B) => E.Env<E2, any>,
  ) =>
  <E3>(
    ma: E.Env<E3, A>,
  ): E.Env<
    E1 & E2 & E3 & KV.Env<symbol>,
    { readonly [K in N | keyof A]: K extends keyof A ? A[K] : () => Disposable }
  > =>
    E.bindW(name, () => useEnvK(f, onValue))(ma)

/**
 * @since 0.11.0
 * @category Options
 */
export type UseReaderStreamWithOptions<E1, A, E2, E3, B> = {
  readonly value: Ref.Ref<E1, O.Option<A>>
} & UseDisposableWithOptions<E2, E3, B>

/**
 * @since 0.11.0
 * @category Use
 */
export const useReaderStreamWith =
  <E1, A, E2, E3, B = void>(options: UseReaderStreamWithOptions<E1, A, E2, E3, B>) =>
  (Eq: Eq<B> = deepEqualsEq) => {
    const use = useDisposableWith(options)(Eq)

    return <E4, C extends A>(
      rs: RS.ReaderStream<E4, C>,
      dep: B,
    ): E.Env<E1 & E2 & E3 & E4 & SchedulerEnv & KV.Env<symbol>, O.Option<C>> =>
      pipe(
        E.asksE((r: E1 & E2 & E3 & E4 & SchedulerEnv) =>
          use(
            () =>
              rs(r).run(
                S.createSink({
                  event: (_, value: C) => pipe(value, O.some, options.value.set, E.execWith(r)),
                }),
                r.scheduler,
              ),
            dep,
          ),
        ),
        E.chainW(() => options.value.get as E.Env<E1, O.Option<C>>),
      )
  }

const defaultUserReaderStreamRefs = <A, B>() => ({
  disposable: Ref.fromKV(KV.make(E.fromIO(disposeNone))),
  changed: defaultOptionRef<A>(),
  value: defaultOptionRef<B>(),
})

/**
 * @since 0.11.0
 * @category Use
 */
export const useReaderStream = <A = void>(Eq: Eq<A> = deepEqualsEq) =>
  useReaderStreamWith(defaultUserReaderStreamRefs<A, any>())(Eq)

/**
 * @since 0.11.0
 * @category Options
 */
export type UseStreamWithOptions<E1, A, E2, E3, B> = UseReaderStreamWithOptions<E1, A, E2, E3, B>

/**
 * @since 0.11.0
 * @category Use
 */
export const useStreamWith =
  <E1, A, E2, E3, B>(options: UseStreamWithOptions<E1, A, E2, E3, B>) =>
  (Eq: Eq<B> = deepEqualsEq) => {
    const useRS = pipe(Eq, useReaderStreamWith(options))

    return (stream: S.Stream<A>, dep: B) => useRS(() => stream, dep)
  }

/**
 * @since 0.11.0
 * @category Use
 */
export const useStream = <A = void>(Eq: Eq<A> = deepEqualsEq) => {
  const use = useStreamWith(defaultUserReaderStreamRefs<A, any>())(Eq)

  return <B>(stream: S.Stream<B>, dep: A): E.Env<KV.Env<symbol> & SchedulerEnv, O.Option<B>> =>
    use(stream, dep)
}

/**
 * @since 0.11.0
 * @category Use
 */
export const useRefsStream = <A, E1, B>(f: (value: A) => RS.ReaderStream<E1, B>, Eq: Eq<A>) => {
  const use = RS.fromEnv(KV.useKeyedEnvs(EqStrict as Eq<S.Stream<A>>))
  const mergeMap = RS.mergeMapWhen(EqStrict as Eq<S.Stream<A>>)

  return <E2>(
    stream: RS.ReaderStream<E2, readonly A[]>,
  ): RS.ReaderStream<E1 & E2 & KV.Env<any>, readonly B[]> =>
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

/**
 * @since 0.11.0
 * @category Use
 */
export const useRefs = <A, E1, B>(f: (value: A) => E.Env<E1, B>, Eq: Eq<A>) =>
  useRefsStream(flow(f, KV.sample), Eq)
