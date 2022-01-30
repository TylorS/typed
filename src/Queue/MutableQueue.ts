import { empty, RefArray } from '@/RefArray'

export interface MutableQueue<A> extends RefArray<unknown, never, A> {}

export const makeMutableQueue: <A>() => MutableQueue<A> = empty
