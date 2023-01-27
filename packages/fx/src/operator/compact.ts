import { identity } from '@fp-ts/core/Function'
import type { Option } from '@fp-ts/core/Option'

import type { Fx } from '../Fx.js'

import { filterMap } from './filterMap.js'

export const compact: <R, E, A>(fx: Fx<R, E, Option<A>>) => Fx<R, E, A> = filterMap(identity)
