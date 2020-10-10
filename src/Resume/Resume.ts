import { Async } from './Async'
import { Sync } from './Sync'

/**
 * Resume is a sync or async effect which is meant to be used
 * for control flow.
 */
export type Resume<A> = Sync<A> | Async<A>
