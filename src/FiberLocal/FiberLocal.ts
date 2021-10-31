import { Eq } from 'fp-ts/Eq'
import { Magma } from 'fp-ts/Magma'
import { Option } from 'fp-ts/Option'

import type { Fx } from '@/Fx'

export interface FiberLocal<R, A> extends Eq<A>, Magma<A> {
  readonly initial: Fx<R, A>
  readonly fork: (a: A) => Option<A>
}
