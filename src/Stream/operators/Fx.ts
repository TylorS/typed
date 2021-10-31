import { flow, pipe } from 'fp-ts/function'

import { Fx, mapTo } from '@/Fx'

import { fromFx } from '../sources'
import { Stream } from '../Stream'
import { join } from './join'
import { map } from './map'
import { mergeConcurrently } from './mergeConcurrently'
import { switchLatest } from './switchLatest'

export function chainFxK<A, R2, B>(f: (a: A) => Fx<R2, B>) {
  return <R>(stream: Stream<R, A>): Stream<R & R2, B> => pipe(stream, map(flow(f, fromFx)), join)
}

export function switchFxK<A, R2, B>(f: (a: A) => Fx<R2, B>) {
  return <R>(stream: Stream<R, A>): Stream<R & R2, B> =>
    pipe(stream, map(flow(f, fromFx)), switchLatest)
}

export function mergeConcurrentlyFxK<A, R2, B>(concurreny: number, f: (a: A) => Fx<R2, B>) {
  return <R>(stream: Stream<R, A>): Stream<R & R2, B> =>
    pipe(stream, map(flow(f, fromFx)), mergeConcurrently(concurreny))
}

export function tapFx<A, R2, B>(f: (a: A) => Fx<R2, B>) {
  return <R>(stream: Stream<R, A>): Stream<R & R2, A> =>
    pipe(
      stream,
      map((a) => pipe(a, f, mapTo(a), fromFx)),
      join,
    )
}

export function tapFxSwitch<A, R2, B>(f: (a: A) => Fx<R2, B>) {
  return <R>(stream: Stream<R, A>): Stream<R & R2, A> =>
    pipe(
      stream,
      map((a) => pipe(a, f, mapTo(a), fromFx)),
      switchLatest,
    )
}

export function tapFxConcurrently<A, R2, B>(concurrency: number, f: (a: A) => Fx<R2, B>) {
  return <R>(stream: Stream<R, A>): Stream<R & R2, A> =>
    pipe(
      stream,
      map((a) => pipe(a, f, mapTo(a), fromFx)),
      mergeConcurrently(concurrency),
    )
}
