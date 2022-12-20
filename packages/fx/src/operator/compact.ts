import { identity } from '@fp-ts/data/Function'
import { Option } from '@fp-ts/data/Option'

import { Fx } from '../Fx.js'

import { filterMap } from './filterMap.js'

export const compact: <R, E, A>(fx: Fx<R, E, Option<A>>) => Fx<R, E, A> = filterMap(identity)
