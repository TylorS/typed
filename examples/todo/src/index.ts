import { Branded } from '@fp/Branded'
import * as E from '@fp/Env'
import * as EO from '@fp/EnvOption'
import { pipe } from '@fp/function'
import * as H from '@fp/hooks'
import * as RS from '@fp/ReaderStream'
import * as U from '@fp/use'
import * as RA from 'fp-ts/ReadonlyArray'

// Domain
interface Todo {
  readonly id: TodoId
  readonly description: string
  readonly completed: boolean
}

type TodoId = Branded<string, { readonly Todo: unique symbol }>
const TodoId = Branded<TodoId>()

const createTodoId = E.op<() => E.Of<TodoId>>()('createTodoId')()

const createNewTodo = (description: string) =>
  pipe(
    createTodoId,
    E.map((id): Todo => ({ id, description, completed: false })),
  )

// Application

import { Eq, EqStrict } from '@fp/Eq'
import * as Ref from '@fp/Ref'
import * as RefArray from '@fp/RefArray'
import { runEffects } from '@fp/Stream'
import { newDefaultScheduler } from '@most/scheduler'
import * as O from 'fp-ts/Option'
import { not } from 'fp-ts/Predicate'
import { html, render } from 'uhtml'

const loadTodos = E.op<() => E.Of<ReadonlyArray<Todo>>>()('loadTodos')()

const saveTodos = E.op<(todos: readonly Todo[]) => E.Of<ReadonlyArray<Todo>>>()('saveTodos')

const Todos = RefArray.create(loadTodos)

const saveTodosOnChanges = pipe(
  Todos.listen,
  RS.chainEnvK((event) => saveTodos(Ref.isRemoved(event) ? [] : event.value)),
)

const isCompleted = (todo: Todo) => todo.completed
const isNotCompleted = not(isCompleted)

const clearCompleted = Todos.filter(isNotCompleted)

const removeTodo = (id: TodoId) => Todos.filter((todo) => todo.id !== id)

const toggleAllTodos = (completed: boolean) => Todos.endoMap((todo) => ({ ...todo, completed }))

const toggleTodoCompletion = (id: TodoId) =>
  Todos.endoMap((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))

const getNumberCompleted = pipe(
  Todos.get,
  E.map((t) => t.filter(isCompleted).length),
)

const getNumberActive = pipe(
  Todos.get,
  E.map((t) => t.filter(isNotCompleted).length),
)

const findTodo = (id: TodoId) =>
  pipe(
    Todos.get,
    E.map((todos) => O.fromNullable(todos.find((todo) => todo.id === id))),
  )

const updateDescription = (id: TodoId, description: string) =>
  Todos.endoMap((todo) => (todo.id === id ? { ...todo, description } : todo))

const SelectedTodo = Ref.create(E.of<O.Option<TodoId>>(O.none))

const selectTodo = (id: TodoId) => SelectedTodo.set(O.some(id))

const deselectTodo = SelectedTodo.set(O.none)

const isSelectedTodo = (id: TodoId) =>
  pipe(
    SelectedTodo.get,
    E.map(
      O.matchW(
        () => false,
        (t) => t === id,
      ),
    ),
  )

type Route = 'all' | 'completed' | 'active'

const getCurrentRoute = E.op<() => E.Of<Route>>()('getCurrentRoute')()

const CurrentRoute = Ref.create(getCurrentRoute)

const filterTodos = (todos: ReadonlyArray<Todo>, route: Route): ReadonlyArray<Todo> => {
  if (route === 'completed') {
    return todos.filter(isCompleted)
  }

  if (route === 'active') {
    return todos.filter(isNotCompleted)
  }

  return todos
}

const getCurrentTodos = pipe(
  E.zipW([Todos.get, CurrentRoute.get] as const),
  E.map(([todos, route]) => filterTodos(todos, route)),
)

// Presentation

const ENTER_KEY = 13
const ESCAPE_KEY = 27

type InputElementEvent = {
  readonly target: HTMLInputElement
  readonly which: number
}

const Header = pipe(
  U.useEnvK((event: InputElementEvent) =>
    event.which === ENTER_KEY
      ? pipe(
          createNewTodo(event.target.value),
          E.chainW(Todos.append),
          E.chainW(() => E.fromIO(() => (event.target.value = ''))),
        )
      : E.of(null),
  ),
  E.map(
    (onKeyDown) => html`<header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        onkeydown="${onKeyDown}"
        placeholder="What needs to be done?"
        autofocus
      />
    </header>`,
  ),
)

const Footer = pipe(
  E.Do,
  E.bindW('route', () => getCurrentRoute),
  E.bindW('numCompleted', () => getNumberCompleted),
  E.bindW('numActive', () => getNumberActive),
  U.bindEnvK('clearCompleted', () => clearCompleted),
  E.map(
    ({ route, numActive, numCompleted, clearCompleted }) => html`<footer class="footer">
      <span class="todo-count">
        <strong>${numActive}</strong> ${numActive === 1 ? 'item' : 'items'} left
      </span>

      <ul class="filters">
        <li><a class="${route === 'all' ? 'selected' : ''}" href="#/">All</a></li>
        <li>
          <a class="${route === 'active' ? 'selected' : ''}" href="#/active">Active</a>
        </li>
        <li>
          <a class="${route === 'completed' ? 'selected' : ''}" href="#/completed">Completed</a>
        </li>
      </ul>

      ${numCompleted
        ? html`
            <button class="clear-completed" onclick="${clearCompleted}">Clear completed</button>
          `
        : ''}
    </footer>`,
  ),
)

const TodoItem = (id: TodoId) =>
  pipe(
    E.Do,
    E.bindW('match', () => findTodo(id)),
    E.bindW('isSelected', () => isSelectedTodo(id)),
    U.bindEnvK('toggleTodo', () => toggleTodoCompletion(id)),
    U.bindEnvK('select', () => selectTodo(id)),
    U.bindEnvK('remove', () =>
      pipe(
        deselectTodo,
        E.chainW(() => removeTodo(id)),
      ),
    ),
    U.bindEnvK('onKeyDown', (event: InputElementEvent) => {
      if (event.which === ENTER_KEY) {
        return E.fromIO<unknown>(() => event.target.blur())
      }

      if (event.which === ESCAPE_KEY) {
        return deselectTodo
      }

      return E.of(null)
    }),
    U.bindEnvK('onBlur', (event: InputElementEvent) =>
      pipe(
        updateDescription(id, event.target.value),
        E.chainFirstW(() => deselectTodo),
      ),
    ),
    E.map(({ match, isSelected, toggleTodo, select, remove, onKeyDown, onBlur }) =>
      pipe(
        match,
        O.map(
          (todo) => html`<li>
            <div class="view">
              <input
                class="toggle"
                type="checkbox"
                checked="${todo.completed}"
                onchange=${toggleTodo}
              />
              <label ondblclick="${select}">${todo.description}</label>
              <button onclick="${remove}" class="destroy"></button>
            </div>

            ${isSelected
              ? html`<input
                  value="${todo.description}"
                  id="edit"
                  class="edit"
                  onkeydown="${onKeyDown}"
                  onblur="${onBlur}"
                  autofocus
                />`
              : ''}
          </li>`,
        ),
      ),
    ),
  )

// Infrastructure

function pseudoRandomUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  }) as TodoId
}

type StorageEnv = {
  readonly storage: Storage
}

const TODOS_STORAGE_KEY = 'todos'

const loadTodosFromStorage = pipe(
  E.ask<StorageEnv>(),
  E.map((e) => O.fromNullable(e.storage.getItem(TODOS_STORAGE_KEY))),
  EO.map((s): readonly Todo[] => JSON.parse(s)),
  EO.getOrElse((): readonly Todo[] => []),
)

const saveTodosToStorage = (todos: readonly Todo[]) =>
  pipe(
    E.ask<StorageEnv>(),
    E.chainW((e) => E.fromIO(() => e.storage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos)))),
  )

type HashEnv = {
  readonly hash: string
}

const parseHash = (hash: string) => {
  const [, route = ''] = hash.split('#/')

  return route
}

const getCurrentRouteFromHash = pipe(
  E.asks((e: HashEnv) => parseHash(e.hash)),
  E.map((hash): Route => {
    if (hash === 'active' || hash === 'completed') {
      return hash
    }

    return 'all'
  }),
)

// Composition

const rootElement = document.getElementById('app')

if (!rootElement) {
  throw new Error(`Unable to find element by selector #app`)
}

const useTodoApp = pipe(
  E.Do,
  E.bindW('header', () => Header),
  E.bindW('footer', () => Footer),
  E.bindW('numCompleted', () => getNumberCompleted),
  E.bindW('currentTodos', () => getCurrentTodos),
  U.bindEnvK('toggleAll', (event: InputElementEvent) => toggleAllTodos(event.target.checked)),
  E.chainFirstW(() => U.useReaderStream(saveTodosOnChanges)),
  H.withHooks,
  RS.multicast,
)

const currentTodos = pipe(
  useTodoApp,
  RS.map((x) => x.currentTodos.map((t) => t.id)),
  RS.tap(console.log),
  H.exhaustAllWithHooks(EqStrict as Eq<TodoId>)(TodoItem),
  RS.map(RA.compact),
)

const TodoApp = pipe(
  RS.combineAll(useTodoApp, currentTodos),
  RS.map(
    ([{ header, footer, numCompleted, toggleAll }, todos]) =>
      html`${header}
      ${pipe(
        todos,
        RA.matchW(
          () => '',
          (list) => html`<section class="main">
            <input
              id="toggle-all"
              class="toggle-all"
              type="checkbox"
              onclick="${toggleAll}"
              checked="${numCompleted === todos.length}"
            />
            <label for="toggle-all">Mark all as complete</label>

            <ul class="todo-list">
              ${list}
            </ul>

            ${footer}
          </section>`,
        ),
      )}`,
  ),
  RS.scan(render, rootElement),
)

const scheduler = newDefaultScheduler()
const stream = TodoApp({
  ...Ref.refs(),
  scheduler,
  loadTodos: () => pipe(loadTodosFromStorage, E.useAll({ storage: localStorage })),
  saveTodos: (todos) =>
    pipe(saveTodosToStorage(todos), E.constant(todos), E.useAll({ storage: localStorage })),
  getCurrentRoute: () => pipe(getCurrentRouteFromHash, E.useAll({ hash: location.hash })),
  createTodoId: () => E.fromIO(pseudoRandomUuid),
})

runEffects(stream, scheduler).catch((err) => {
  console.error(err)
})
