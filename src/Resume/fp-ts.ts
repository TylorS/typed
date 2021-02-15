import { MonadRec1 } from '@fp/MonadRec'
import { Alt1 } from 'fp-ts/Alt'
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { FromIO1 } from 'fp-ts/FromIO'
import { FromTask1 } from 'fp-ts/FromTask'
import { constant, flow, pipe } from 'fp-ts/function'
import { bindTo as bindTo_, Functor1, tupled as tupled_ } from 'fp-ts/Functor'
import { bind as bind_, Monad1 } from 'fp-ts/Monad'
import { Pointed1 } from 'fp-ts/Pointed'

import { ap } from './ap'
import { fromTask } from './Async'
import { chain } from './chain'
import { chainRec } from './monadRec'
import { race } from './race'
import { Resume } from './Resume'
import { sync } from './Sync'

export const URI = '@typed/fp/Resume'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: Resume<A>
  }
}

export const Functor: Functor1<URI> = {
  URI,
  map: (f) => (fa) => pipe(fa, chain(flow(f, constant, sync))),
}

export const map = Functor.map

export const Pointed: Pointed1<URI> = {
  ...Functor,
  of: flow(constant, sync),
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

export const FromTask: FromTask1<URI> = {
  ...FromIO,
  fromTask,
}

export const Do: Resume<{}> = sync(() => Object.create(null))
export const bindTo = bindTo_(Functor)
export const bind = bind_(Monad)
export const tupled = tupled_(Functor)
