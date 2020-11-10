import { rafEnv, whenIdleEnv } from '@typed/fp/browser/exports'
import { execPure, provideAll } from '@typed/fp/Effect/exports'
import { createWhenIdleHandlers, Patch, patchOnRaf } from '@typed/fp/Patch/exports'
import { sync } from '@typed/fp/Resume/Sync'
import { provideSchedulerEnv } from '@typed/fp/scheduler/exports'
import { createSharedEnvProvider, defaultHandlers } from '@typed/fp/Shared/exports'
import { pipe } from 'fp-ts/lib/function'
import { Hole, render } from 'lighterhtml-plus'

import { Counters } from './Counters'

const rootElementSelector = `#app`
const rootElement = document.querySelector(rootElementSelector)

if (!rootElement) {
  throw new Error(`Unable to find root element ${rootElementSelector}`)
}

const lighterHtmlPatch: Patch<Element, Hole> = {
  patch: (a, b) => sync(render(a, b)),
}

pipe(
  patchOnRaf(rootElement, Counters),
  createSharedEnvProvider({
    handlers: [
      ...defaultHandlers,
      ...createWhenIdleHandlers({ ...lighterHtmlPatch, ...whenIdleEnv }),
    ],
  }),
  provideSchedulerEnv,
  provideAll({ ...lighterHtmlPatch, ...rafEnv }),
  execPure,
)
