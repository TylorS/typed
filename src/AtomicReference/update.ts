import { Eq } from 'fp-ts/Eq'

import type { AtomicReference } from './AtomicReference'
import { modify } from './modify'

export function update<A>(Eq: Eq<A>) {
  return (f: (value: A) => A) =>
    (ref: AtomicReference<A>): A =>
      modify(Eq)((x) => [null, f(x)])(ref)[1]
}
