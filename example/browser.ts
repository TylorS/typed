import { browser } from '@typed/framework/browser'
import * as Fx from '@typed/fx'
import { hydrate } from '@typed/html/browser'

import { ui } from './routing.js'

// Bootstrap running application
const rootElement = document.getElementById('application')

if (!rootElement) {
  throw new Error('Could not find #application element')
}

// Provide resources to the program
hydrate(ui).pipe(Fx.provideSomeLayer(browser(window, { rootElement })), Fx.runPromiseExit)
