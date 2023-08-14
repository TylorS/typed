import * as Fx from '@typed/fx'
import { render } from '@typed/html/browser'

import { Live } from './infrastructure.js'
import { TodoApp } from './presentation.js'

render(TodoApp).pipe(Fx.provideSomeLayer(Live), Fx.runPromiseExit)
