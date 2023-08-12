import * as Schema from '@effect/schema/Schema'

export const TodoId = Schema.string.pipe(Schema.brand('TodoId'))
export type TodoId = Schema.To<typeof TodoId>

export const Todo = Schema.struct({
  id: TodoId,
  text: Schema.string,
  completed: Schema.boolean,
  timestamp: Schema.dateFromString(Schema.string),
})
export type TodoJson = Schema.From<typeof Todo>
export type Todo = Schema.To<typeof Todo>

export const TodoList = Schema.array(Todo)
export type TodoListJson = Schema.From<typeof TodoList>
export type TodoList = Schema.To<typeof TodoList>

export function updateTodo(list: TodoList, id: TodoId, f: (todo: Todo) => Todo): TodoList {
  return list.map((todo) => (todo.id === id ? f(todo) : todo))
}

export function editText(list: TodoList, id: TodoId, text: string): TodoList {
  return updateTodo(list, id, (todo) => ({ ...todo, text }))
}

export function toggleCompleted(list: TodoList, id: TodoId): TodoList {
  return updateTodo(list, id, (todo) => ({ ...todo, completed: !todo.completed }))
}

export function toggleAllCompleted(list: TodoList): TodoList {
  if (list.every((todo) => todo.completed))
    return list.map((todo) => ({ ...todo, completed: false }))

  return list.map((todo) => ({ ...todo, completed: true }))
}

export function deleteTodo(list: TodoList, id: TodoId): TodoList {
  return list.filter((todo) => todo.id !== id)
}

export function clearCompleted(list: TodoList): TodoList {
  return list.filter((todo) => !todo.completed)
}

export function remainingCount(list: TodoList): number {
  return list.filter((todo) => !todo.completed).length
}

export function completedCount(list: TodoList): number {
  return list.filter((todo) => todo.completed).length
}

export function allAreCompleted(list: TodoList): boolean {
  return list.length > 0 && list.every((todo) => todo.completed)
}

export enum ViewState {
  All = 'All',
  Active = 'Active',
  Completed = 'Completed',
}

export function filterViewState(list: TodoList, state: ViewState): TodoList {
  switch (state) {
    case ViewState.All:
      return list
    case ViewState.Active:
      return list.filter((todo) => !todo.completed)
    case ViewState.Completed:
      return list.filter((todo) => todo.completed)
  }
}
