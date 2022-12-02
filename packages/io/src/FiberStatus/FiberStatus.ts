import { Exit } from '@typed/exit'

export type FiberStatus<E, A> = Pending | Running | Done<E, A>

export interface Pending {
  readonly tag: 'Pending'
}

export const Pending: Pending = { tag: 'Pending' }

export interface Running {
  readonly tag: 'Running'
}

export const Running: Running = { tag: 'Running' }

export interface Done<E, A> {
  readonly tag: 'Done'
  readonly exit: Exit<E, A>
}

export const Done = <E, A>(exit: Exit<E, A>): Done<E, A> => ({
  tag: 'Done',
  exit,
})
