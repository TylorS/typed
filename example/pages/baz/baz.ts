import * as Route from '@typed/route'

import { Counter } from 'example/components/counter-with-dom-source.js'

export const route = Route.Route('/baz/:baz')

export const main = Counter
