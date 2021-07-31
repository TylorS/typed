/**
 *
 * `Resume` is a possibly synchronous or asynchronous effect type. Conceptually you can think of
 * `Resume` as a union between the `IO` and `Task` monads w/ cancelation. The `Disposable` interface is
 * borrowed from `@most/core`'s internal types and makes it easy to interoperate. Using `Disposable`
 * makes it easy to reuse the `@most/scheduler` package for providing scheduling consistent with any
 * other most-based workflows you have.
 *
 * The beauty of `Resume` is that it can do work as fast as possible without delay. Sync when possible
 * but async when needed allows you to unify your sync/async workflows using a single monad w/ easy
 * interop with your existing IO/Task allowing for cancelation when required.
 * @since 0.9.2
 */
import { Disposable } from '@most/types'
import { Alt1 } from 'fp-ts/Alt'
import { Applicative1, getApplicativeMonoid } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as FIO from 'fp-ts/FromIO'
import { FromIO1 } from 'fp-ts/FromIO'
import * as FT from 'fp-ts/FromTask'
import { FromTask1 } from 'fp-ts/FromTask'
import { constant, constVoid, flow, pipe } from 'fp-ts/function'
import { bindTo as bindTo_, Functor1, tupled as tupled_ } from 'fp-ts/Functor'
import { IO } from 'fp-ts/IO'
import { Monad1 } from 'fp-ts/Monad'
import { isNone, none, Option, some } from 'fp-ts/Option'
import { Pointed1 } from 'fp-ts/Pointed'
import * as RA from 'fp-ts/ReadonlyArray'
import { Task } from 'fp-ts/Task'

import { disposeBoth, disposeNone, settable, undisposable } from './Disposable'
import { Arity1 } from './function'
import { MonadRec1 } from './MonadRec'

/**
 * @since 0.9.2
 * @category Model
 */
export type Resume<A> = Sync<A> | Async<A>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type ValueOf<A> = [A] extends [Resume<infer R>] ? R : never

/**
 * @since 0.9.2
 * @category Model
 */
export interface Async<A> {
  readonly _tag: 'async'
  readonly resume: AsyncResume<A>
}

/**
 * @since 0.9.2
 * @category Model
 */
export type AsyncResume<A> = (resume: (value: A) => Disposable) => Disposable

/**
 * @since 0.9.2
 * @category Constructor
 */
export const async = <A>(resume: AsyncResume<A>): Async<A> => ({ _tag: 'async', resume })

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromTask = <A>(task: Task<A>): Async<A> =>
  async((resume) => {
    const disposable = settable()

    task().then((r) => {
      if (!disposable.isDisposed()) {
        disposable.addDisposable(resume(r))
      }
    })

    return disposable
  })

/**
 * @since 0.9.2
 * @category Model
 */
export interface Sync<A> {
  readonly _tag: 'sync'
  readonly resume: IO<A>
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const sync = <A>(resume: IO<A>): Sync<A> => ({ _tag: 'sync', resume })

/**
 * @since 0.9.2
 * @category Refinement
 */
export const isSync = <A>(resume: Resume<A>): resume is Sync<A> => resume._tag === 'sync'

/**
 * @since 0.9.2
 * @category Refinement
 */
export const isAsync = <A>(resume: Resume<A>): resume is Async<A> => resume._tag === 'async'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap =
  <A>(fa: Resume<A>) =>
  <B>(fab: Resume<Arity1<A, B>>): Resume<B> => {
    if (isSync(fa) && isSync(fab)) {
      return sync(() => fab.resume()(fa.resume()))
    }

    // Concurrently
    return async((resume) => {
      const disposable = settable()

      let ab: Option<Arity1<A, B>> = isSync(fab) ? some(fab.resume()) : none
      let a: Option<A> = isSync(fa) ? some(fa.resume()) : none

      function onReady() {
        if (isNone(ab) || isNone(a)) {
          return disposeNone()
        }

        if (!disposable.isDisposed()) {
          disposable.addDisposable(resume(ab.value(a.value)))
        }

        return disposable
      }

      if (isAsync(fab)) {
        disposable.addDisposable(
          fab.resume((f) => {
            ab = some(f)

            return onReady()
          }),
        )
      }

      if (isAsync(fa)) {
        disposable.addDisposable(
          fa.resume((x) => {
            a = some(x)

            return onReady()
          }),
        )
      }

      return disposable
    })
  }

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const run =
  <A>(f: Arity1<A, Disposable>) =>
  (resume: Resume<A>): Disposable =>
    isAsync(resume) ? resume.resume(f) : f(resume.resume())

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const start = <A>(f: Arity1<A, any>) => run(undisposable(f))

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const exec = start<any>(constVoid)

/**
 * @since 0.9.2
 * @category Model
 */
export type DisposableTask<A> = () => DisposablePromise<A>
/**
 * @since 0.9.2
 * @category Model
 */
export type DisposablePromise<A> = Promise<A> & Disposable

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const toTask = <A>(resume: Resume<A>): DisposableTask<A> => {
  const task = () => {
    const d = settable()
    const p = new Promise<A>((resolve) => d.addDisposable(pipe(resume, start(resolve))))

    ;(p as Promise<A> & Disposable).dispose = () => d.dispose()

    return p as Promise<A> & Disposable
  }

  return task
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain =
  <A, B>(f: Arity1<A, Resume<B>>) =>
  (resume: Resume<A>): Resume<B> =>
    isSync(resume) ? f(resume.resume()) : async((r) => resume.resume(flow(f, run(r))))

/**
 * @since 0.9.2
 * @category Constructor
 */
export const of = flow(constant, sync)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, B>(f: Arity1<A, Resume<E.Either<A, B>>>) =>
  (value: A): Resume<B> => {
    let resume = f(value)

    while (isSync(resume)) {
      const either = resume.resume()

      if (E.isRight(either)) {
        return of(either.right)
      }

      resume = f(either.left)
    }

    // Recursion is okay because Resume SHOULD be asynchronous
    return pipe(resume, chain(E.match(chainRec(f), of)))
  }

/**
 * @since 0.9.2
 * @category Combinator
 */
export const race =
  <A>(ra: Resume<A>) =>
  <B>(rb: Resume<B>): Resume<A | B> => {
    if (isSync(rb)) {
      return rb
    }

    if (isSync(ra)) {
      return ra
    }

    return async((resume) => {
      const aDisposableLazy = settable()
      const bDisposable = pipe(
        rb,
        run((b) => {
          aDisposableLazy.dispose()
          return resume(b)
        }),
      )

      const aDisposable = pipe(
        ra,
        run((a) => {
          bDisposable.dispose()
          return resume(a)
        }),
      )

      aDisposableLazy.addDisposable(aDisposable)

      return disposeBoth(bDisposable, aDisposable)
    })
  }

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/Resume'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: Resume<A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed1<URI> = {
  of,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: Functor1<URI> = {
  URI,
  map: (f) => (fa) => pipe(fa, chain(flow(f, of))),
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = Functor.map

/**
 * @since 0.9.2
 * @category Instance
 */
export const Apply: Apply1<URI> = {
  ...Functor,
  ap,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Ch.Chain1<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirst = Ch.chainFirst(Chain)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad1<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec1<URI> = {
  URI,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec1<URI> = {
  ...Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alt: Alt1<URI> = {
  ...Functor,
  alt: (snd) => (fst) => pipe(fst, race(snd())),
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromIO: FromIO1<URI> = {
  URI,
  fromIO: sync,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromIO = FromIO.fromIO

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromTask: FromTask1<URI> = {
  ...FromIO,
  fromTask,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const Do: Resume<{}> = sync(() => Object.create(null))
/**
 * @since 0.9.2
 * @category Combinator
 */
export const bindTo = bindTo_(Functor)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const bind = Ch.bind(Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const tupled = tupled_(Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const traverseReadonlyArray = RA.traverse(Applicative)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const traverseReadonlyArrayWithIndex = RA.traverseWithIndex(Applicative)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const zip = traverseReadonlyArray(<A>(x: Resume<A>) => x)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstTaskK = FT.chainFirstTaskK(FromTask, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainTaskK = FT.chainTaskK(FromTask, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromTaskK = FT.fromTaskK(FromTask)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainIOK = FIO.chainIOK(FromIO, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromIOK = FIO.fromIOK(FromIO)

/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getMonoid = getApplicativeMonoid(Applicative)
