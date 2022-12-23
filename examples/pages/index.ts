import * as M from '@typed/module/index.js'

import { Counter, Example } from '../components/counter-with-service.js'

import * as Route from '@typed/route/index.js'

export default M.make({
  routes: [Route.base],
  main: Counter,
  environment: Example.layerOf({ name: 'Counter' }),
})
