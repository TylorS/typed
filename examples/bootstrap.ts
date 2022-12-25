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

document.addEventListener('DOMContentLoaded', () => {
  pipe(
    runPages(pages),
    renderInto(parentElement),
    provideBrowserIntrinsics(window, { parentElement }),
    Fx.unsafeRunAsync,
  )
})
