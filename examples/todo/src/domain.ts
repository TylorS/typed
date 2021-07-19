import { Branded } from '@fp/Branded'
import * as E from '@fp/Env'
import { not } from 'fp-ts/Predicate'

export interface Todo {
  readonly id: TodoId
  readonly description: string
  readonly completed: boolean
}

export type TodoId = Branded<string, Todo>
export const TodoId = Branded<TodoId>()

export const createTodo = E.op<(description: string) => E.Of<Todo>>()('createTodo')

export const isCompletedTodo = (todo: Todo): boolean => todo.completed
export const isActiveTodo = not(isCompletedTodo)
