import * as Route from '@typed/route'

import { Counter } from 'example/components/counter-with-dom-source.js'

export const route = Route.Route('/baz/:baz')

// Any exported Fx, or Fx-returning function can easily be lazy loaded
export const main = Counter
