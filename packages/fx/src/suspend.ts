import { Fx } from './Fx.js'

export function suspend<R, E, A>(f: () => Fx<R, E, A>): Fx<R, E, A> {
  return Fx((sink) => f().run(sink))
}
