import { Exit } from '@typed/exit'

export type FiberStatus<E, A> = Suspended | Running | Done<E, A>

export interface Suspended {
  readonly _tag: 'Suspended'
}

export const Suspended: Suspended = { _tag: 'Suspended' }

export interface Running {
  readonly _tag: 'Running'
}

export const Running: Running = { _tag: 'Running' }

export interface Done<E, A> {
  readonly _tag: 'Done'
  readonly exit: Exit<E, A>
}

export const Done = <E, A>(exit: Exit<E, A>): Done<E, A> => ({
  _tag: 'Done',
  exit,
})
