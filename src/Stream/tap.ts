import { Time } from '@/Clock'
import { EventElement } from '@/Sink'

import { Stream } from './Stream'

export const tap =
  <A>(f: (value: A) => any) =>
  <R, E>(stream: Stream<R, E, A>): Stream<R, E, A> => ({
    run: (resources, sink, ...rest) =>
      stream.run(
        resources,
        {
          ...sink,
          event: (event) => {
            f(event.value)

            return sink.event(event)
          },
        },
        ...rest,
      ),
  })

export const tapEvent =
  <A>(f: (value: EventElement<A>) => any) =>
  <R, E>(stream: Stream<R, E, A>): Stream<R, E, A> => ({
    run: (resources, sink, ...rest) =>
      stream.run(
        resources,
        {
          ...sink,
          event: (event) => {
            f(event)

            return sink.event(event)
          },
        },
        ...rest,
      ),
  })

export const tapEnd =
  (f: (time: Time) => any) =>
  <R, E, A>(stream: Stream<R, E, A>): Stream<R, E, A> => ({
    run: (resources, sink, context, scope, tracer) =>
      stream.run(
        resources,
        {
          ...sink,
          end: (event) => {
            f(event.time)

            return sink.end(event)
          },
        },
        context,
        scope,
        tracer,
      ),
  })
