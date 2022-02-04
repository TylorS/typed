import { FutureQueue, make } from '@/FutureQueue'

export type WaitFor<A> = FutureQueue<unknown, never, A>

export const makeWaitFor = <A>(): WaitFor<A> => make()
