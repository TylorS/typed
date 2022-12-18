import { Fx } from '../Fx.js'

export function suspend<R, E, A>(f: () => Fx<R, E, A>): Fx<R, E, A> {
  return new SuspendFx(f)
}

export class SuspendFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly f: () => Fx<R, E, A>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return this.f().run(sink)
  }
}
