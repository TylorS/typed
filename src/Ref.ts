import { Eq } from 'fp-ts/Eq'

import { Env } from './Env'
import { deepEqualsEq } from './Eq'

export interface Ref<Id, E, A> extends Eq<A> {
  readonly id: Id
  readonly initial: Env<E, A>
}

export function make<Id extends string, E, A>(
  id: Id,
  initial: Env<E, A>,
  eq: Eq<A> = deepEqualsEq,
): Ref<Id, E, A> {
  return {
    id,
    initial,
    equals: eq.equals,
  }
}
