import { IO } from 'fp-ts/dist/IO'

export interface Sync<A> {
  readonly _tag: 'sync'
  readonly resume: IO<A>
}

export const sync = <A>(resume: IO<A>): Sync<A> => ({ _tag: 'sync', resume })
