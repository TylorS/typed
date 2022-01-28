import { Time } from '@/Clock'
import { EventElement } from '@/Sink'

import { Stream } from './Stream'

export const tap =
  <A>(f: (value: A) => any) =>
  <R, E>(stream: Stream<R, E, A>): Stream<R, E, A> => ({
    run: (sink, context) =>
      stream.run(
        {
          ...sink,
          event: (event) => {
            f(event.value)

            return sink.event(event)
          },
        },
        context,
      ),
  })

export const tapEvent =
  <A>(f: (value: EventElement<A>) => any) =>
  <R, E>(stream: Stream<R, E, A>): Stream<R, E, A> => ({
    run: (sink, context) =>
      stream.run(
        {
          ...sink,
          event: (event) => {
            f(event)

            return sink.event(event)
          },
        },
        context,
      ),
  })

export const tapEnd =
  (f: (time: Time) => any) =>
  <R, E, A>(stream: Stream<R, E, A>): Stream<R, E, A> => ({
    run: (sink, context) =>
      stream.run(
        {
          ...sink,
          end: (event) => {
            f(event.time)

            return sink.end(event)
          },
        },
        context,
      ),
  })
