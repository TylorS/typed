import { Disposable } from '@most/types'
import { Alt1 } from 'fp-ts/Alt'
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { bind as bind_, Chain1 } from 'fp-ts/Chain'
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

export type Resume<A> = Sync<A> | Async<A>

export interface Async<A> {
  readonly _tag: 'async'
  readonly resume: AsyncResume<A>
}

export type AsyncResume<A> = (resume: (value: A) => Disposable) => Disposable

export const async = <A>(resume: AsyncResume<A>): Async<A> => ({ _tag: 'async', resume })

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

export interface Sync<A> {
  readonly _tag: 'sync'
  readonly resume: IO<A>
}

export const sync = <A>(resume: IO<A>): Sync<A> => ({ _tag: 'sync', resume })

export const isSync = <A>(resume: Resume<A>): resume is Sync<A> => resume._tag === 'sync'

export const isAsync = <A>(resume: Resume<A>): resume is Async<A> => resume._tag === 'async'

export const ap = <A>(fa: Resume<A>) => <B>(fab: Resume<Arity1<A, B>>): Resume<B> => {
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
        return disposable.addDisposable(resume(ab.value(a.value)))
      }

      return disposeNone()
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

export const run = <A>(f: Arity1<A, Disposable>) => (resume: Resume<A>): Disposable =>
  isAsync(resume) ? resume.resume(f) : f(resume.resume())

export const start = <A>(f: Arity1<A, any>) => run(undisposable(f))

export const exec = start(constVoid)

export const chain = <A, B>(f: Arity1<A, Resume<B>>) => (resume: Resume<A>): Resume<B> =>
  isSync(resume) ? f(resume.resume()) : async((r) => resume.resume(flow(f, run(r))))

export const of = flow(constant, sync)

export const chainRec = <A, B>(f: Arity1<A, Resume<E.Either<A, B>>>) => (value: A): Resume<B> => {
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

export const race = <A>(ra: Resume<A>) => <B>(rb: Resume<B>): Resume<A | B> => {
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

export const URI = '@typed/fp/Resume'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: Resume<A>
  }
}

export const Pointed: Pointed1<URI> = {
  of,
}

export const Functor: Functor1<URI> = {
  URI,
  map: (f) => (fa) => pipe(fa, chain(flow(f, of))),
}

export const map = Functor.map

export const Apply: Apply1<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain1<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad1<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec1<URI> = {
  URI,
  chainRec,
}

export const MonadRec: MonadRec1<URI> = {
  ...Monad,
  chainRec,
}

export const Alt: Alt1<URI> = {
  ...Functor,
  alt: (snd) => (fst) => pipe(fst, race(snd())),
}

export const FromIO: FromIO1<URI> = {
  URI,
  fromIO: sync,
}

export const fromIO = FromIO.fromIO

export const FromTask: FromTask1<URI> = {
  ...FromIO,
  fromTask,
}

export const Do: Resume<{}> = sync(() => Object.create(null))
export const bindTo = bindTo_(Functor)
export const bind = bind_(Monad)
export const tupled = tupled_(Functor)

export const zip = RA.traverse(Applicative)(<A>(x: Resume<A>) => x)

export const chainFirstTaskK = FT.chainFirstTaskK(FromTask, Chain)
export const chainTaskK = FT.chainTaskK(FromTask, Chain)
export const fromTaskK = FT.fromTaskK(FromTask)

export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)
export const chainIOK = FIO.chainIOK(FromIO, Chain)
export const fromIOK = FIO.fromIOK(FromIO)
