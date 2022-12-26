import { pipe } from '@fp-ts/data/Function'
import { provideBrowserIntrinsics, runPages } from '@typed/framework/index.js'

import * as Fx from '@typed/fx/index.js'
import { renderInto } from '@typed/html/index.js'

const parentElementId = 'application'
const parentElement = document.getElementById(parentElementId)

if (!parentElement) {
  throw new Error(`Could not find element with id "${parentElementId}"`)
}

const pages = import.meta.glob('./pages/**/*', { eager: true })

console.log(pages)

const main = pipe(
  // Import all page modules to instantiate routes
  runPages(pages),
  // Render application into the DOM
  renderInto(parentElement),
  // Provide all the framework-level services
  provideBrowserIntrinsics(window, { parentElement }),
)

document.addEventListener('DOMContentLoaded', () => Fx.unsafeRunAsync(main))
