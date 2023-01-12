// A module is the main workhorse of the framework. It is the joining of route and a main function
// to use to render when the route is matched.

import { html } from '@typed/html'
import * as Route from '@typed/route'

// ** Route ** //

// A module is a route and a main/render function

export const route = Route.home

// ----------------------------------------------

// ** Main/Render ** //

// A main function is a function that takes a route's params and returns a render function.
// The main function can ignore the params if it doesn't need them and just return an Fx, like below.

export const main = html`<h2>Home</h2>`

// ----------------------------------------------

// ** Environment ** //

// Optionally a module can expose an environment to provide resources

// export const environment: Layer<IntrinsicServices, never, ResourcesOfLayout> = ...

// ----------------------------------------------

// ** Layout ** //

// Optionally a module can expose a layout specifically for itself.
// See layout.ts for more information.

// export const layout = ....
