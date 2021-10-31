import { Stream } from '../Stream'
import { Map } from './map'

export const tap =
  <A>(f: (a: A) => any) =>
  <R>(stream: Stream<R, A>) =>
    Map.create(stream, (a) => {
      f(a)

      return a
    })
