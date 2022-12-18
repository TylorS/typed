import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from '../Fx.js'

export class NeverFx extends Fx.Variance<never, never, never> implements Fx<never, never, never> {
  constructor() {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  run<R2>(_: Sink<R2, never, never>) {
    return Effect.never()
  }
}

export const never: Fx<never, never, never> = new NeverFx()
