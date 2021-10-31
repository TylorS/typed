import { getContext } from '@/Fiber/Instruction'
import { Fx } from '@/Fx'

import { FiberLocal } from './FiberLocal'

export function get<R, A>(local: FiberLocal<R, A>): Fx<R, A> {
  return Fx(function* () {
    const { locals } = yield* getContext

    return yield* locals.get(local)
  })
}
