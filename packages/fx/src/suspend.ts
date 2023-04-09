import { Fx } from '@typed/fx/Fx'

export function suspend<R, E, A>(f: () => Fx<R, E, A>): Fx<R, E, A> {
  return Fx((sink) => f().run(sink))
}
