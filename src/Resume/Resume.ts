import { Async } from './Async'
import { Sync } from './Sync'

export type Resume<A> = Sync<A> | Async<A>

export const isSync = <A>(resume: Resume<A>): resume is Sync<A> => resume._tag === 'sync'

export const isAsync = <A>(resume: Resume<A>): resume is Async<A> => resume._tag === 'async'
