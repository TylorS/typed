import * as E from '@fp/Env'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as RefArray from '@fp/RefArray'
import * as F from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'

import { createTodo, isActiveTodo, isCompletedTodo, Todo, TodoId } from './domain'

// Current Todo Filter

export type TodoFilter = 'all' | 'active' | 'completed'

export const getCurrentFilter = E.op<() => E.Of<TodoFilter>>()('getCurrentFilter')()

export const CurrentFilter = Ref.create(getCurrentFilter)

// Currently selected Todo

export const SelectedTodo = Ref.create(E.of<O.Option<TodoId>>(O.none))

export const isSelectedTodo = (todo: Todo) =>
  F.pipe(
    SelectedTodo.get,
    E.map(
      F.flow(
        O.map((selectedId) => selectedId === todo.id),
        O.getOrElseW(() => false),
      ),
    ),
  )

export const selectTodo = (todo: Todo) => SelectedTodo.set(O.some(todo.id))

export const deselectTodo = SelectedTodo.set(O.none)

// Todos

export const loadTodos = E.op<() => E.Of<readonly Todo[]>>()('loadTodos')()

export const Todos = RefArray.create(loadTodos)

export const clearCompleted = Todos.filter(isActiveTodo)

export const removeTodoById = (id: TodoId) => Todos.filter((todo) => todo.id !== id)

export const toggleAll = (completed: boolean) => Todos.endoMap((todo) => ({ ...todo, completed }))

export const updateTodoDescription = (todo: Todo, description: string) =>
  Todos.endoMap((t) => (t.id === todo.id ? { ...t, description } : t))

export const updateTodoCompleted = (todo: Todo, completed: boolean) =>
  Todos.endoMap((t) => (t.id === todo.id ? { ...t, completed } : t))

export const createNewTodo = F.flow(createTodo, E.chainW(Todos.append))

export const getTodos = F.pipe(
  E.zipW([Todos.get, CurrentFilter.get] as const),
  E.map(([todos, filter]) => filterTodos(filter, todos)),
)

export const filterTodos = (filter: TodoFilter, todos: readonly Todo[]): readonly Todo[] => {
  if (filter === 'active') {
    return todos.filter(isActiveTodo)
  }

  if (filter === 'completed') {
    return todos.filter(isCompletedTodo)
  }

  return todos
}

export const getNumActiveTodos = F.pipe(Todos.get, E.map(F.flow(RA.filter(isActiveTodo), RA.size)))

export const getNumCompletedTodos = F.pipe(
  Todos.get,
  E.map(F.flow(RA.filter(isCompletedTodo), RA.size)),
)

export const saveTodos = E.op<(todos: readonly Todo[]) => E.Of<void>>()('saveTodos')

export const saveTodosOnChange = F.pipe(
  Todos.values,
  RS.tap((x) => console.log(x)),
  RS.chainEnvK(saveTodos),
)
