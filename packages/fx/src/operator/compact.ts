import { identity } from '@effect/data/Function'
import type { Option } from '@effect/data/Option'

import type { Fx } from '../Fx.js'

import { filterMap } from './filterMap.js'

export const compact: <R, E, A>(fx: Fx<R, E, Option<A>>) => Fx<R, E, A> = filterMap(identity)
