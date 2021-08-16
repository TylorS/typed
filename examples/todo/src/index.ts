import { rafEnv } from '@fp/browser'
import * as DOM from '@fp/dom'
import * as E from '@fp/Env'
import * as KV from '@fp/KV'
import * as RS from '@fp/ReaderStream'
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

const Main = F.pipe(
  TodoApp,
  DOM.patchKV(render, '.todoapp'),
  RS.mergeFirst(saveTodosOnChange),
  RS.mergeFirst(updateFilterOnHashChange),
)

const stream: Stream<HTMLElement> = Main({
  document,
  ...rafEnv,
  ...KV.env(),
  loadTodos: () => E.fromIO(loadTodosFromStorage),
  saveTodos: saveTodosToStorage,
  getCurrentFilter: () => E.fromIO(getCurrentFilterFromLocation),
  createTodo: F.flow(createTodoFromDescription, E.of),
})

runEffects(stream, newDefaultScheduler()).catch((error) => {
  console.error(error)

  throw error
})
