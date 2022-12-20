import { Fx } from '../Fx.js'

import { combineAll } from './combine.js'

export const tuple = <Streams extends readonly Fx<any, any, any>[]>(
  streams: readonly [...Streams],
) => combineAll(...streams)
