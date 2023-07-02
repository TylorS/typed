import { Effect } from './Effect.js'
import { identity } from './_function.js'

export abstract class Variance<R, E, A> implements Effect.Variance<R, E, A> {
  readonly _R = identity
  readonly _E = identity
  readonly _A = identity
}
