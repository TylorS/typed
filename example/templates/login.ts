import { Ref } from '@effect/core/io/Ref'

import { EventHandler, html } from '../../src/HTML'

export const login = (isAuthenticated: Ref<boolean>) => html`<h2>Login</h2>

  <p>Are you human?</p>

  <button onclick=${EventHandler(() => isAuthenticated.set(true))}>Yes</button>
  <button onclick=${EventHandler(() => isAuthenticated.set(false))}>No</button>`
