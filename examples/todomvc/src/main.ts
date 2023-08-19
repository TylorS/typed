import { browser } from '@typed/framework/browser'
import * as Fx from '@typed/fx'
import { hydrate } from '@typed/html/browser'

import { Live } from './infrastructure.js'
import { TodoApp } from './presentation.js'

hydrate(TodoApp).pipe(
  Fx.provideSomeLayer(Live),
  Fx.provideSomeLayer(browser(window)),
  Fx.runPromiseExit,
)
