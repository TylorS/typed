import { Fx } from '../Fx.js'

import { map } from './map.js'

export function as<B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, B> {
  return map(() => value)
}
