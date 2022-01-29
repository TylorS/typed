import { Fx } from '@/Fx'
import { Has } from '@/Has'

import { get } from './get'
import { Service } from './Service'

export const access =
  <A, R, E, B>(f: (a: A) => Fx<R, E, B>) =>
  <Name extends string>(service: Service<Name, A>): Fx<R & Has<Name, A>, E, B> =>
    Fx(function* () {
      const a = yield* get(service)

      return yield* f(a)
    })
