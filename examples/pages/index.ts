import { Counter } from '../components/counter-with-service.js'

import { html } from '@typed/html/index.js'
import * as Route from '@typed/route/index.js'
import * as Router from '@typed/router/index.js'

export const route = Route.base

export const main = Counter

export const layout = html`<div>${Router.outlet}</div>`
