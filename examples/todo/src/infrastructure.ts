import * as E from '@fp/Env'
import * as RS from '@fp/ReaderStream'
import * as S from '@fp/Stream'
import * as F from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { CurrentFilter, TodoFilter } from './application'
import { Todo, TodoId } from './domain'

const TODOS_KEY = 'todos'

export const ALL_HASH = '#/'
export const ACTIVE_HASH = '#/active'
export const COMPLETED_HASH = '#/completed'

export const getCurrentFilterFromLocation = (): TodoFilter => {
  const hash = location.hash

  if (hash === ACTIVE_HASH) {
    return 'active'
  }

  if (hash === COMPLETED_HASH) {
    return 'completed'
  }

  if (hash !== ALL_HASH) {
    location.hash = ALL_HASH
  }

  return 'all'
}

export const hashChanges = S.newStream<TodoFilter>((sink, scheduler) => {
  const listener = () => sink.event(scheduler.currentTime(), getCurrentFilterFromLocation())

  window.addEventListener('hashchange', listener)

  return { dispose: () => window.removeEventListener('hashchange', listener) }
})

export const updateFilterOnHashChange = F.pipe(
  hashChanges,
  RS.fromStream,
  RS.chainEnvK(CurrentFilter.set),
)

export const createTodoFromDescription = (description: string): Todo => ({
  id: TodoId(psuedoRandomUuid()),
  description,
  completed: false,
})

export const psuedoRandomUuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == 'x' ? r : (r & 0x3) | 0x8

    return v.toString(16)
  })

export const loadTodosFromStorage = () =>
  F.pipe(
    localStorage.getItem(TODOS_KEY),
    O.fromNullable,
    O.map((x) => JSON.parse(x)),
    O.getOrElse((): readonly Todo[] => []),
  )

export const saveTodosToStorage = (todos: readonly Todo[]) =>
  E.fromIO(() => localStorage.setItem(TODOS_KEY, JSON.stringify(todos)))
