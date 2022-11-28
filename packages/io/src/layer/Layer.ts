import { Context } from '@fp-ts/data/Context'

import { FiberRef } from '../fiberRef/fiberRef.js'

export interface Layer<R, E, A> extends FiberRef<R, E, Context<A>> {}
