import { Fx, Sink } from '../Fx.js'

export class EmptyFx extends Fx.Variance<never, never, never> implements Fx<never, never, never> {
  constructor() {
    super()
  }

  run<R2>(sink: Sink<R2, never, never>) {
    return sink.end
  }
}

export const empty: Fx<never, never, never> = new EmptyFx()
