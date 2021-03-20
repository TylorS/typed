import {
  ap,
  awaitPromises,
  chain,
  empty,
  filter,
  map,
  merge,
  mergeConcurrently,
  multicast,
  newStream,
  now,
  switchLatest,
  take,
} from '@most/core'
import { asap } from '@most/scheduler'
import { Stream } from '@most/types'
import { undisposable } from '@typed/fp/Disposable'
import { FromResume1 } from '@typed/fp/FromResume'
import { run } from '@typed/fp/Resume'
import { Alt1 } from 'fp-ts/dist/Alt'
import { Alternative1 } from 'fp-ts/dist/Alternative'
import { Applicative1 } from 'fp-ts/dist/Applicative'
import { Apply1 } from 'fp-ts/dist/Apply'
import { bind as bind_ } from 'fp-ts/dist/Chain'
import { ChainRec1 } from 'fp-ts/dist/ChainRec'
import { Compactable1 } from 'fp-ts/dist/Compactable'
import { Either, isLeft, isRight, Left, left, match, Right, right } from 'fp-ts/dist/Either'
import { Filterable1 } from 'fp-ts/dist/Filterable'
import { FromIO1 } from 'fp-ts/dist/FromIO'
import { FromTask1 } from 'fp-ts/dist/FromTask'
import { flow, pipe } from 'fp-ts/dist/function'
import { bindTo as bindTo_, Functor1, tupled as tupled_ } from 'fp-ts/dist/Functor'
import { Monad1 } from 'fp-ts/dist/Monad'
import { Monoid } from 'fp-ts/dist/Monoid'
import { isSome, Option, Some } from 'fp-ts/dist/Option'
import { Pointed1 } from 'fp-ts/dist/Pointed'
import { Predicate } from 'fp-ts/dist/Predicate'
import { Separated } from 'fp-ts/dist/Separated'
import { Task } from 'fp-ts/dist/Task'

import { createCallbackTask } from './createCallbackTask'

export const URI = '@most/core/Stream' as const

export type URI = typeof URI

declare module 'fp-ts/dist/HKT' {
  interface URItoKind<A> {
    [URI]: Stream<A>
  }
}

/**
 * Create a Stream monoid where concat is a parallel merge.
 */
export const getMonoid = <A>(): Monoid<Stream<A>> => {
  return {
    concat: merge,
    empty: empty(),
  }
}

/**
 * Filter Option's from within a Stream
 */
export const compact = <A>(stream: Stream<Option<A>>): Stream<A> =>
  map((s: Some<A>) => s.value, filter(isSome, stream))

/**
 * Separate left and right values
 */
export const separate = <A, B>(stream: Stream<Either<A, B>>): Separated<Stream<A>, Stream<B>> => {
  const s = multicast(stream)
  const left = map((l: Left<A>) => l.left, filter(isLeft, s))
  const right = map((r: Right<B>) => r.right, filter(isRight, s))

  return { left, right }
}

export const partitionMap = <A, B, C>(f: (a: A) => Either<B, C>) => (fa: Stream<A>) =>
  separate(map(f, fa))

export const partition = <A>(predicate: Predicate<A>) =>
  partitionMap((a: A) => (predicate(a) ? right(a) : left(a)))

export const filterMap = <A, B>(f: (a: A) => Option<B>) => (fa: Stream<A>) => compact(map(f, fa))

export const Functor: Functor1<URI> = {
  URI,
  map,
}

export const Pointed: Pointed1<URI> = {
  of: now,
}

export const Apply: Apply1<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

export const Monad: Monad1<URI> = {
  ...Functor,
  ...Pointed,
  chain,
}

export const chainRec = <A, B>(f: (value: A) => Stream<Either<A, B>>) => (value: A): Stream<B> =>
  pipe(value, f, chain(match(chainRec(f), now)))

export const ChainRecChain: ChainRec1<URI> = {
  ...Monad,
  chainRec,
}

export const switchRec = <A, B>(f: (value: A) => Stream<Either<A, B>>) => (value: A): Stream<B> =>
  pipe(value, f, map(match(switchRec(f), now)), switchLatest)

export const ChainRecSwitch: ChainRec1<URI> = {
  ...Monad,
  chainRec: switchRec,
}

export const mergeConcurrentlyRec = (concurrency: number) => <A, B>(
  f: (value: A) => Stream<Either<A, B>>,
) => (value: A): Stream<B> =>
  pipe(
    value,
    f,
    map(match(mergeConcurrentlyRec(concurrency)(f), now)),
    mergeConcurrently(concurrency),
  )

export const getConcurrentChainRec = (concurrency: number): ChainRec1<URI> => ({
  ...Monad,
  chainRec: mergeConcurrentlyRec(concurrency),
})

export const FromIO: FromIO1<URI> = {
  URI,
  fromIO: (f) => Functor.map(f)(now(undefined)),
}

export const fromIO = FromIO.fromIO

const applyTask = <A>(task: Task<A>): Stream<Promise<A>> => ap(now(task), now(void 0))

export const FromTask: FromTask1<URI> = {
  ...FromIO,
  fromTask: flow(applyTask, awaitPromises),
}

export const fromTask = FromTask.fromTask

export const FromResume: FromResume1<URI> = {
  fromResume: (resume) =>
    newStream((sink, scheduler) =>
      asap(
        createCallbackTask(() =>
          pipe(resume, run(undisposable((a) => sink.event(scheduler.currentTime(), a)))),
        ),
        scheduler,
      ),
    ),
}

export const fromResume = FromResume.fromResume

export const Alt: Alt1<URI> = {
  ...Functor,
  alt: (f) => (fa) => take(1, merge(fa, f())), // race the 2 streams
}

export const race = Alt.alt

export const Alternative: Alternative1<URI> = {
  ...Alt,
  zero: empty,
}

export const zero = Alternative.zero

export const Compactable: Compactable1<URI> = {
  URI,
  compact,
  separate,
}

export const Filterable: Filterable1<URI> = {
  partitionMap,
  partition,
  filterMap,
  filter,
}

export const Do: Stream<{}> = pipe(null, now, map(Object.create))
export const bindTo = bindTo_(Functor)
export const bind = bind_(Monad)
export const tupled = tupled_(Functor)
