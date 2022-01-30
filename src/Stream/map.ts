import { Stream } from './Stream'

export const map =
  <A, B>(f: (value: A) => B) =>
  <R, E>(stream: Stream<R, E, A>): Stream<R, E, B> => ({
    run: (sink, context) =>
      stream.run(
        {
          ...sink,
          event: (event) => sink.event({ ...event, value: f(event.value) }),
        },
        context,
      ),
  })
