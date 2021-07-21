import * as M from '@most/core'
import { disposeAll, disposeNone } from '@most/disposable'
import { asap, schedulerRelativeTo } from '@most/scheduler'
import * as types from '@most/types'
import * as Alt_ from 'fp-ts/Alt'
import { Alternative1 } from 'fp-ts/Alternative'
import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as CH from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import { Compactable1 } from 'fp-ts/Compactable'
import { Either, isLeft, isRight, left, match, right } from 'fp-ts/Either'
import { Eq } from 'fp-ts/Eq'
import { Filterable1 } from 'fp-ts/Filterable'
import { FromIO1 } from 'fp-ts/FromIO'
import { FromTask1 } from 'fp-ts/FromTask'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { bindTo as bindTo_, Functor1, tupled as tupled_ } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import { Monoid } from 'fp-ts/Monoid'
import * as O from 'fp-ts/Option'
import { Pointed1 } from 'fp-ts/Pointed'
import { Predicate } from 'fp-ts/Predicate'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RM from 'fp-ts/ReadonlyMap'
import { Separated } from 'fp-ts/Separated'
import { Task } from 'fp-ts/Task'
import { fst, snd } from 'fp-ts/Tuple2'

import { Adapter, create } from './Adapter'
import { disposeBoth, settable } from './Disposable'
import { deepEqualsEq } from './Eq'
import * as FRe from './FromResume'
import { Arity1 } from './function'
import * as R from './Resume'

export type Stream<A> = types.Stream<A>

export type ValueOf<A> = [A] extends [Stream<infer R>] ? R : never

/**
 * Convert an IO<Disposable> into a Most.js Task
 */
export function createCallbackTask(
  cb: Arity1<types.Time, types.Disposable>,
  onError?: (error: Error) => void,
): types.Task {
  const disposable = settable()

  return {
    run(t) {
      if (!disposable.isDisposed()) {
        disposable.addDisposable(cb(t))
      }
    },
    error(_, e) {
      disposable.dispose()

      if (onError) {
        return onError(e)
      }

      throw e
    },
    dispose: disposable.dispose,
  }
}

export const URI = '@most/core/Stream' as const

export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    [URI]: types.Stream<A>
  }
}

/**
 * Create a Stream monoid where concat is a parallel merge.
 */
export const getMonoid = <A>(): Monoid<types.Stream<A>> => {
  return {
    concat: M.merge,
    empty: M.empty(),
  }
}

/**
 * Filter Option's from within a Stream
 */
export const compact = <A>(stream: types.Stream<O.Option<A>>): types.Stream<A> =>
  M.map((s: O.Some<A>) => s.value, M.filter(O.isSome, stream))

/**
 * Separate left and right values
 */
export const separate = <A, B>(
  stream: types.Stream<Either<A, B>>,
): Separated<types.Stream<A>, types.Stream<B>> => {
  const s = M.multicast(stream)
  const left = pipe(
    s,
    M.filter(isLeft),
    M.map((l) => l.left),
  )
  const right = pipe(
    s,
    M.filter(isRight),
    M.map((r) => r.right),
  )

  return { left, right }
}

export const partitionMap =
  <A, B, C>(f: (a: A) => Either<B, C>) =>
  (fa: types.Stream<A>) =>
    separate(M.map(f, fa))

export const partition = <A>(predicate: Predicate<A>) =>
  partitionMap((a: A) => (predicate(a) ? right(a) : left(a)))

export const filterMap =
  <A, B>(f: (a: A) => O.Option<B>) =>
  (fa: types.Stream<A>) =>
    compact(M.map(f, fa))

export const Functor: Functor1<URI> = {
  map: M.map,
}

export const Pointed: Pointed1<URI> = {
  of: M.now,
}

export const of = Pointed.of

export const Apply: Ap.Apply1<URI> = {
  ...Functor,
  ap: M.ap,
}

export const apFirst = Ap.apFirst(Apply)
export const apS = Ap.apS(Apply)
export const apSecond = Ap.apSecond(Apply)
export const apT = Ap.apT(Apply)
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

export const Applicative: App.Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

export const getApplicativeMonoid = App.getApplicativeMonoid(Applicative)

export const Chain: CH.Chain1<URI> = {
  ...Functor,
  chain: M.chain,
}

export const chainFirst = CH.chainFirst(Chain)
export const bind = CH.bind(Chain)

export const Monad: Monad1<URI> = {
  ...Chain,
  ...Pointed,
}

export const chainRec =
  <A, B>(f: (value: A) => types.Stream<Either<A, B>>) =>
  (value: A): types.Stream<B> =>
    pipe(value, f, M.delay(0), M.chain(match(flow(chainRec(f)), M.now)))

export const ChainRec: ChainRec1<URI> = {
  chainRec,
}

export const switchRec =
  <A, B>(f: (value: A) => types.Stream<Either<A, B>>) =>
  (value: A): types.Stream<B> =>
    pipe(value, f, M.map(match(switchRec(f), M.now)), M.switchLatest)

export const SwitchRec: ChainRec1<URI> = {
  chainRec: switchRec,
}

export const mergeConcurrentlyRec =
  (concurrency: number) =>
  <A, B>(f: (value: A) => types.Stream<Either<A, B>>) =>
  (value: A): types.Stream<B> =>
    pipe(
      value,
      f,
      M.map(match(mergeConcurrentlyRec(concurrency)(f), M.now)),
      M.mergeConcurrently(concurrency),
    )

export const getConcurrentChainRec = (concurrency: number): ChainRec1<URI> => ({
  chainRec: mergeConcurrentlyRec(concurrency),
})

export const FromIO: FromIO1<URI> = {
  fromIO: (f) => Functor.map(f)(M.now(undefined)),
}

export const fromIO = FromIO.fromIO

const applyTask = <A>(task: Task<A>): types.Stream<Promise<A>> => M.ap(M.now(task), M.now(void 0))

export const FromTask: FromTask1<URI> = {
  ...FromIO,
  fromTask: flow(applyTask, M.awaitPromises),
}

export const fromTask = FromTask.fromTask

export const FromResume: FRe.FromResume1<URI> = {
  fromResume: (resume) =>
    M.newStream((sink, scheduler) => {
      const run = () =>
        pipe(
          resume,
          R.start((a) => {
            sink.event(scheduler.currentTime(), a)
            sink.end(scheduler.currentTime())
          }),
        )

      const onError = (error: Error) => sink.error(scheduler.currentTime(), error)

      return asap(createCallbackTask(run, onError), scheduler)
    }),
}

export const fromResume = FromResume.fromResume

export const chainFirstResumeK = FRe.chainFirstResumeK(FromResume, Chain)
export const chainResumeK = FRe.chainResumeK(FromResume, Chain)
export const fromResumeK = FRe.fromResumeK(FromResume)

export const Alt: Alt_.Alt1<URI> = {
  ...Functor,
  alt: (f) => (fa) => M.take(1, M.merge(fa, f())), // race the 2 streams
}

export const race = Alt.alt

export const Alternative: Alternative1<URI> = {
  ...Alt,
  zero: M.empty,
}

export const zero = Alternative.zero

export const Compactable: Compactable1<URI> = {
  compact,
  separate,
}

export const Filterable: Filterable1<URI> = {
  partitionMap,
  partition,
  filterMap,
  filter: M.filter,
}

export const Do: types.Stream<{}> = pipe(null, M.now, M.map(Object.create))
export const bindTo = bindTo_(Functor)
export const tupled = tupled_(Functor)

const emptySink: types.Sink<any> = {
  event: constVoid,
  error: constVoid,
  end: constVoid,
}

export const createSink = <A>(sink: Partial<types.Sink<A>> = {}): types.Sink<A> => ({
  ...emptySink,
  ...sink,
})

export const collectEvents =
  (scheduler: types.Scheduler) =>
  <A>(stream: types.Stream<A>) => {
    const events: A[] = []

    return M.runEffects(
      M.tap((a) => events.push(a), stream),
      scheduler,
    ).then(() => events as readonly A[])
  }

export const onDispose =
  (disposable: types.Disposable) =>
  <A>(stream: types.Stream<A>): types.Stream<A> =>
    M.newStream((sink, scheduler) => disposeBoth(stream.run(sink, scheduler), disposable))

export const combineAll = <A extends readonly types.Stream<any>[]>(
  ...streams: A
): types.Stream<{ readonly [K in keyof A]: ValueOf<A[K]> }> =>
  pipe(streams as any, M.combineArray(Array)) as any

export const exhaustLatest = <A>(stream: types.Stream<types.Stream<A>>): types.Stream<A> =>
  new ExhaustLatest(stream)

export const exhaustMapLatest =
  <A, B>(f: (value: A) => types.Stream<B>) =>
  (stream: types.Stream<A>) =>
    pipe(stream, M.map(f), exhaustLatest)

class ExhaustLatest<A> implements types.Stream<A> {
  constructor(readonly stream: types.Stream<types.Stream<A>>) {}

  run(sink: types.Sink<A>, scheduler: types.Scheduler) {
    const s = new ExhaustLatestSink(sink, scheduler)

    return disposeBoth(this.stream.run(s, scheduler), s)
  }
}

class ExhaustLatestSink<A> implements types.Sink<types.Stream<A>>, types.Disposable {
  protected latest: O.Option<types.Stream<A>> = O.none
  protected disposable: types.Disposable = disposeNone()
  protected sampling = false
  protected shouldResample = false
  protected finished = false
  protected innerSink: types.Sink<A>

  constructor(readonly sink: types.Sink<A>, readonly scheduler: types.Scheduler) {
    this.innerSink = {
      event: (t, a) => sink.event(t, a),
      error: (t, e) => this.error(t, e),
      end: (t) => {
        this.sampling = false

        if (this.shouldResample && O.isSome(this.latest)) {
          this.event(scheduler.currentTime(), this.latest.value)

          return
        }

        if (this.finished) {
          this.dispose()
          sink.end(t)
        }
      },
    }
  }

  event = (t: types.Time, stream: types.Stream<A>) => {
    this.latest = O.some(stream)

    if (this.sampling) {
      this.shouldResample = true

      return
    }

    this.sampling = true
    this.shouldResample = false
    this.disposable = stream.run(this.innerSink, schedulerRelativeTo(t, this.scheduler))
  }

  error = (t: types.Time, e: Error) => {
    this.dispose()
    this.sink.error(t, e)
  }

  end = (_: types.Time) => {
    this.finished = true
  }

  dispose = () => {
    this.disposable.dispose()
    this.sampling = false
    this.shouldResample = false
  }
}

/**
 * Using the provided Eq mergeMapWhen conditionally applies a Kliesli arrow
 * to the values within an Array when they are added and any values removed
 * from the array will be disposed of immediately.
 */
export const mergeMapWhen =
  <V>(Eq: Eq<V> = deepEqualsEq) =>
  <A>(f: (value: V) => types.Stream<A>) =>
  (values: Stream<ReadonlyArray<V>>): Stream<ReadonlyArray<A>> =>
    new MergeMapWhen(Eq, f, values)

class MergeMapWhen<V, A> implements types.Stream<ReadonlyArray<A>> {
  constructor(
    readonly Eq: Eq<V>,
    readonly f: (getValue: V) => types.Stream<A>,
    readonly values: Stream<ReadonlyArray<V>>,
  ) {}

  run(sink: types.Sink<ReadonlyArray<A>>, scheduler: types.Scheduler): types.Disposable {
    const s = new MergeMapWhenSink(sink, scheduler, this)

    return disposeBoth(this.values.run(s, scheduler), s)
  }
}

class MergeMapWhenSink<V, A> implements types.Sink<ReadonlyArray<V>> {
  readonly disposables = new Map<V, types.Disposable>()
  readonly values = new Map<V, A>()

  readonly findDifference: (second: readonly V[]) => (first: readonly V[]) => readonly V[]
  readonly findDisposable: (k: V) => O.Option<types.Disposable>
  readonly findValue: (k: V) => O.Option<A>

  current: ReadonlyArray<V> = []
  finished = false
  referenceCount = 0
  disposable: types.Disposable = disposeNone()

  constructor(
    readonly sink: types.Sink<ReadonlyArray<A>>,
    readonly scheduler: types.Scheduler,
    readonly source: MergeMapWhen<V, A>,
  ) {
    this.findDisposable = (k: V) => RM.lookup(source.Eq)(k)(this.disposables)
    this.findValue = (k: V) => RM.lookup(source.Eq)(k)(this.values)
    this.findDifference = RA.difference(source.Eq)
  }

  event = (t: types.Time, values: ReadonlyArray<V>) => {
    const removed = pipe(this.current, this.findDifference(values))
    const added = pipe(values, this.findDifference(this.current))

    this.current = values

    // Clean up all the removed keys
    pipe(removed, RA.map(this.findDisposable), RA.compact, disposeAll).dispose()
    removed.forEach((r) => this.values.delete(r))

    // Subscribe to all the newly added values
    added.forEach((a) => this.disposables.set(a, this.runInner(t, a)))

    this.emitIfReady()
  }

  error = (t: types.Time, error: Error) => {
    this.dispose()
    this.sink.error(t, error)
  }

  end = (t: types.Time) => {
    this.finished = true
    this.endIfReady(t)
  }

  dispose = () => {
    this.finished = true
    this.disposables.forEach((d) => d.dispose())
    this.disposables.clear()
    this.values.clear()
    this.current = []
  }

  runInner = (t: types.Time, v: V) =>
    this.source.f(v).run(this.innerSink(v), schedulerRelativeTo(t, this.scheduler))

  innerSink = (v: V): types.Sink<A> => {
    this.referenceCount++

    return {
      event: (_, a) => {
        this.values.set(v, a)

        this.emitIfReady()
      },
      error: (t, e) => this.error(t, e),
      end: (t) => {
        this.referenceCount--
        this.endIfReady(t)
      },
    }
  }

  emitIfReady = () => {
    const values = pipe(this.current, RA.map(this.findValue), RA.compact)

    if (values.length === this.current.length) {
      this.sink.event(this.scheduler.currentTime(), values)
    }
  }

  endIfReady = (t: types.Time) => {
    if (this.finished && this.referenceCount === 0) {
      this.sink.end(t)
      this.dispose()
    }
  }
}

export const keyed =
  <A>(Eq: Eq<A>) =>
  (stream: Stream<ReadonlyArray<A>>): Stream<ReadonlyArray<Stream<A>>> =>
    new Keyed<A>(Eq, stream)

class Keyed<A> implements Stream<ReadonlyArray<Stream<A>>> {
  constructor(readonly Eq: Eq<A>, readonly stream: Stream<ReadonlyArray<A>>) {}

  run(sink: types.Sink<ReadonlyArray<Stream<A>>>, scheduler: types.Scheduler): types.Disposable {
    const s = new KeyedSink(this.Eq, sink, scheduler)

    return disposeBoth(s, this.stream.run(s, scheduler))
  }
}

class KeyedSink<A> implements types.Sink<ReadonlyArray<A>>, types.Disposable {
  adapters = new Map<A, readonly [values: Adapter<A>, endSignal: Adapter<null>]>()

  current: readonly A[] = []
  findDifference: (second: readonly A[]) => (first: readonly A[]) => readonly A[]
  findAdapter: (
    k: A,
  ) => O.Option<
    readonly [
      values: readonly [(event: A) => void, types.Stream<A>],
      endSignal: readonly [(event: null) => void, types.Stream<null>],
    ]
  >

  constructor(
    readonly Eq: Eq<A>,
    readonly sink: types.Sink<ReadonlyArray<Stream<A>>>,
    readonly scheduler: types.Scheduler,
  ) {
    this.findDifference = RA.difference(Eq)
    this.findAdapter = (k: A) => RM.lookup(Eq)(k)(this.adapters)
  }

  event = (t: types.Time, values: readonly A[]) => {
    // Clean up after any removed values
    const removed = pipe(this.current, this.findDifference(values))

    removed.forEach((r) => {
      // Send the end signal
      this.getAdapter(r)[1][0](null)

      // Delete
      this.adapters.delete(r)
    })

    this.current = values

    // Emit our latest set of streams
    this.sink.event(
      t,
      values.map((a) => pipe(a, this.getAdapter, fst, snd)),
    )

    values.forEach((a) => pipe(a, this.getAdapter, fst, fst)(a))
  }

  getAdapter = (k: A) => {
    return pipe(
      k,
      this.findAdapter,
      O.getOrElseW(() => {
        const endSignal = create<null>()
        const values = create<A, A>(flow(M.startWith(k), M.until<A>(endSignal[1]), M.multicast))
        const adapter = [values, endSignal] as const

        this.adapters.set(k, adapter)

        return adapter
      }),
    )
  }

  error = (t: types.Time, err: Error) => {
    this.dispose()
    this.sink.error(t, err)
  }

  end = (t: types.Time) => {
    this.dispose()
    this.sink.end(t)
  }

  dispose = () => {
    this.current = []
    this.adapters.clear()
  }
}

export const switchFirst =
  <A>(second: Stream<A>) =>
  <B>(first: Stream<B>): Stream<B> =>
    pipe(
      first,
      M.map((a) => pipe(second, M.constant(a), M.startWith(a))),
      M.switchLatest,
    )

export function mergeFirst<A>(a: Stream<A>) {
  return <B>(b: Stream<B>): Stream<B> =>
    pipe(pipe(a, M.constant(O.none)), M.merge(pipe(b, M.map(O.some))), compact)
}

export * from '@most/core'
export * from '@most/types'
