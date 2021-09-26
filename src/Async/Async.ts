import { Cancelable } from '@/Cancelable'

export type Async<A> = (cb: (value: A) => void) => Cancelable
