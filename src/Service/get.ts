import { ask, Fx } from '@/Fx'
import { HAS, Has } from '@/Has'

import { Service } from './Service'

export const get = <Name extends string, A>(service: Service<Name, A>) =>
  Fx(function* () {
    const { [HAS]: services } = yield* ask<Has<Name, A>>()

    return (services as any)[service] as A
  })
