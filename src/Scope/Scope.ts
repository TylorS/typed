import type { GlobalScope } from './GlobalScope'
import { LocalScope } from './LocalScope'

export type Scope<E, A> = LocalScope<E, A> | GlobalScope
