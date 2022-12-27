// A global fallback only work at the root-level directories

import { html } from '@typed/html/index.js'

// ** Fallback ** //

export const fallback = (path: string) =>
  html`<h1>404</h1>
    <p>Path: ${path}</p>`

// Path is optional

// export const fallback = html`<h1>404</h1>`

// ----------------------------------------------

// ** Redirects ** //

// Optionally, they can expose a route to perform a redirect in case of no match.

// export { route } from './home.js'

// If the route requires params they can be exported as well

// export const params = { key: 'value' }
