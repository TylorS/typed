import * as E from '@fp/Env'
import * as U from '@fp/use'
import { flow, pipe } from 'fp-ts/function'
import * as RA from 'fp-ts/ReadonlyArray'
import { html } from 'uhtml'

import {
  clearCompleted,
  createNewTodo,
  deselectTodo,
  getCurrentFilter,
  getNumActiveTodos,
  getNumCompletedTodos,
  getTodos,
  isSelectedTodo,
  removeTodoById,
  selectTodo,
  toggleAll,
  updateTodoCompleted,
  updateTodoDescription,
} from './application'
import { Todo } from './domain'
import { ACTIVE_HASH, ALL_HASH, COMPLETED_HASH } from './infrastructure'

type HTMLInputElementEvent = Event & {
  readonly which: number
  readonly target: HTMLInputElement
}

const ENTER_KEY = 13
const ESCAPE_KEY = 27

const Header = pipe(
  U.useEnvK((event: HTMLInputElementEvent) =>
    event.which === ENTER_KEY
      ? pipe(
          createNewTodo(event.target.value),
          E.chainW(() =>
            E.fromIO(() => {
              event.target.value = ''
            }),
          ),
        )
      : E.of(null),
  ),
  E.map(
    (create) => html`<header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        onkeydown="${create}"
        placeholder="What needs to be done?"
        autofocus
      />
    </header>`,
  ),
)

const Footer = pipe(
  E.Do,
  E.bindW('currentFilter', () => getCurrentFilter),
  E.bindW('numActive', () => getNumActiveTodos),
  E.bindW('numCompleted', () => getNumCompletedTodos),
  U.bindEnvK('clearCompleted', () => clearCompleted),
  E.map(
    ({ numActive, numCompleted, currentFilter, clearCompleted }) => html`<footer class="footer">
      <span class="todo-count">
        <strong>${numActive}</strong> ${numActive === 1 ? 'item' : 'items'} left
      </span>

      <ul class="filters">
        <li><a class="${currentFilter === 'all' ? 'selected' : ''}" href="${ALL_HASH}">All</a></li>
        <li>
          <a class="${currentFilter === 'active' ? 'selected' : ''}" href="${ACTIVE_HASH}"
            >Active</a
          >
        </li>
        <li>
          <a class="${currentFilter === 'completed' ? 'selected' : ''}" href="${COMPLETED_HASH}"
            >Completed</a
          >
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

const useTodoItem = (todo: Todo) =>
  pipe(
    E.Do,
    E.bindW('todo', () => E.of(todo)),
    E.bindW('isEditing', () => isSelectedTodo(todo)),
    U.bindEnvK('toggle', (event: HTMLInputElementEvent) =>
      updateTodoCompleted(todo, event.target.checked),
    ),
    U.bindEnvK('remove', () => removeTodoById(todo.id)),
    U.bindEnvK('select', () => selectTodo(todo)),
    U.bindEnvK('submit', (event: HTMLInputElementEvent) =>
      pipe(
        updateTodoDescription(todo, event.target.value),
        E.chainFirstW(() => deselectTodo),
      ),
    ),
    U.bindEnvK('handleEdit', (event: HTMLInputElementEvent) =>
      event.which === ESCAPE_KEY
        ? pipe(deselectTodo, E.constant(void 0))
        : E.fromIO(() => (event.which === ENTER_KEY ? event.target.blur() : void 0)),
    ),
  )

const todoItemTemplate = ({
  todo,
  isEditing,
  toggle,
  select,
  remove,
  handleEdit,
  submit,
}: E.ValueOf<typeof useTodoItem>) =>
  html`<li class="${`${todo.completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}`}">
    <div class="view">
      <input class="toggle" type="checkbox" .checked="${todo.completed}" onchange=${toggle} />
      <label ondblclick="${select}">${todo.description}</label>
      <button onclick="${remove}" class="destroy"></button>
    </div>

    ${isEditing
      ? html`<input
          value="${todo.description}"
          id="edit"
          class="edit"
          onkeydown="${handleEdit}"
          onblur="${submit}"
          autofocus
        />`
      : ''}
  </li>`

const TodoItem = flow(useTodoItem, E.map(todoItemTemplate))

const useTodoApp = pipe(
  E.Do,
  E.bindW('header', () => Header),
  E.bindW('footer', () => Footer),
  E.bindW('todos', () => pipe(getTodos, E.chainW(flow(RA.map(TodoItem), E.zipW)))),
  E.bindW('numCompleted', () => getNumCompletedTodos),
  U.bindEnvK('toggleAll', (ev: HTMLInputElementEvent) => toggleAll(ev.target.checked)),
)

const todoAppTemplate = ({
  header,
  footer,
  todos,
  numCompleted,
  toggleAll,
}: E.ValueOf<typeof useTodoApp>) => html` ${header}
${pipe(
  todos,
  RA.matchW(
    () => '',
    (todos) => html`<section class="main">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        onchange="${toggleAll}"
        .checked="${numCompleted === todos.length}"
      />
      <label for="toggle-all">Mark all as complete</label>

      <ul class="todo-list">
        ${todos}
      </ul>
    </section>`,
  ),
)}
${footer}`

export const TodoApp = pipe(useTodoApp, E.map(todoAppTemplate))
