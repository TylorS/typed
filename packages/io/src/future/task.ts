import { Effect, wait } from '../effect/definition.js'

import { pending } from './future.js'

export class Task<R, E, A> {
  protected future = pending<R, E, A>()

  constructor(readonly effect: Effect<R, E, A>) {}

  readonly wait = wait(this.future)

  readonly run = () => this.future.complete(this.effect)
}
