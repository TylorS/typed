import { Effect } from './Effect.js'
import { identity } from './_function.js'

export abstract class Variance<R, A> implements Effect.Variance<R, A> {
  readonly _R = identity
  readonly _A = identity
}
