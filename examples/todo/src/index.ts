import * as E from '@fp/Env'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import { runEffects } from '@fp/Stream'
import { newDefaultScheduler } from '@most/scheduler'
import * as F from 'fp-ts/function'
import { render } from 'uhtml'

import * as A from './application'
import * as I from './infrastructure'
import * as P from './presentation'

const rootElement = document.querySelector('.todoapp')

if (!rootElement) {
  throw new Error(`Unable to find root element .todoapp`)
}

const Main = F.pipe(
  P.TodoApp,
  Ref.sample, // Sample our TodoApp everytime there is a Ref update
  RS.scan(render, rootElement), // Render
  // Additional stream-based effects
  RS.mergeFirst(A.saveTodosOnChange),
  RS.mergeFirst(I.updateFilterOnHashChange),
)

const scheduler = newDefaultScheduler()

const stream = Main({
  ...Ref.refs(),
  loadTodos: () => E.fromIO(I.loadTodosFromStorage),
  saveTodos: I.saveTodosToStorage,
  getCurrentFilter: () => E.fromIO(I.getCurrentFilterFromLocation),
  createTodo: F.flow(I.createTodoFromDescription, E.of),
})

runEffects(stream, scheduler).catch((error) => {
  console.error(error)

  throw error
})
