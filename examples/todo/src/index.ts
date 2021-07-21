import * as E from '@fp/Env'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import { runEffects, Stream } from '@fp/Stream'
import { newDefaultScheduler } from '@most/scheduler'
import * as F from 'fp-ts/function'
import { render } from 'uhtml'

import { saveTodosOnChange } from './application'
import {
  createTodoFromDescription,
  getCurrentFilterFromLocation,
  loadTodosFromStorage,
  saveTodosToStorage,
  updateFilterOnHashChange,
} from './infrastructure'
import { TodoApp } from './presentation'

const rootElement = document.querySelector<HTMLElement>('.todoapp')

if (!rootElement) {
  throw new Error(`Unable to find root element .todoapp`)
}

const Main = F.pipe(
  TodoApp,
  Ref.sample, // Sample our TodoApp everytime there is a Ref update
  RS.scan(render, rootElement), // Render
  // Additional effects
  RS.mergeFirst(saveTodosOnChange),
  RS.mergeFirst(updateFilterOnHashChange),
)

const stream: Stream<HTMLElement> = Main({
  ...Ref.refs(),
  loadTodos: () => E.fromIO(loadTodosFromStorage),
  saveTodos: saveTodosToStorage,
  getCurrentFilter: () => E.fromIO(getCurrentFilterFromLocation),
  createTodo: F.flow(createTodoFromDescription, E.of),
})

runEffects(stream, newDefaultScheduler()).catch((error) => {
  console.error(error)

  throw error
})
