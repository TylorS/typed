// Fallbacks only work at root-level directories
// If multiple are needed, root-level sibling directories can be used.

import { html } from '@typed/html/index.js'

// ** Fallback ** //

export const fallback = (path: string) =>
  html`<h1>404</h1>
    <p>Path: ${path}</p>`

// Path is optional

// export const fallback = html`<h1>404</h1>`

// ----------------------------------------------

// ** Redirects ** //

// Optionally, they can expose a route to perform a redirect in case of no match

// * They can either expose a route (and any params it might need) { route, params? } *
// export { route } from './home.js'

// If the route requires params they can be exported as well
// export const params = { key: 'value' }
