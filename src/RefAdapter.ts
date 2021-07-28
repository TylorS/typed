import { pipe } from 'fp-ts/function'
import { fst, snd } from 'fp-ts/Tuple2'

import * as A from './Adapter'
import * as E from './Env'
import * as RS from './ReaderStream'
import * as Ref from './Ref'

export interface RefAdapter<E, A, B = A> extends Ref.Reference<E, A.Adapter<A, B>> {}

export function sendEvent<E, A, B = A>(ra: RefAdapter<E, A, B>) {
  return (event: A) =>
    pipe(
      ra,
      Ref.get,
      E.chainIOK(
        ([send]) =>
          () =>
            send(event),
      ),
    )
}

export function getSendEvent<E, A, B = A>(ra: RefAdapter<E, A, B>) {
  return pipe(ra, Ref.get, E.map(fst))
}

export function listenToEvents<E1, A, B = A>(ra: RefAdapter<E1, A, B>) {
  return <E2, C>(f: (value: B) => E.Env<E2, C>): RS.ReaderStream<E1 & E2 & Ref.Get, C> =>
    pipe(
      ra,
      Ref.get,
      E.map(snd),
      RS.fromEnv,
      RS.chainStreamK((x) => x),
      RS.chainEnvK(f),
    )
}

export interface ReferenceAdapter<E, A, B = A> extends RefAdapter<E, A, B> {
  readonly send: (event: A) => E.Env<E & Ref.Get, void>
  readonly getSend: E.Env<E & Ref.Get, (event: A) => void>
  readonly onEvent: <E2, C>(f: (value: B) => E.Env<E2, C>) => RS.ReaderStream<E & E2 & Ref.Get, C>
}

export function toReferenceAdapter<E, A, B>(ra: RefAdapter<E, A, B>): ReferenceAdapter<E, A, B> {
  return {
    ...ra,
    send: sendEvent(ra),
    getSend: getSendEvent(ra),
    onEvent: listenToEvents(ra),
  }
}