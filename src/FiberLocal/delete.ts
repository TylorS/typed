import { Option } from 'fp-ts/Option'

import { getContext } from '@/Fiber/Instruction'
import { Fx } from '@/Fx'

import { FiberLocal } from './FiberLocal'

export function remove<R, A>(local: FiberLocal<R, A>): Fx<unknown, Option<A>> {
  return Fx(function* () {
    const { locals } = yield* getContext

    return yield* locals.delete(local)
  })
}

export { remove as delete }
