import { rafEnv, whenIdleEnv } from '@typed/fp/browser/exports'
import { execEffect } from '@typed/fp/Effect/exports'
import { createWhenIdleHandlers, Patch, patchOnRaf } from '@typed/fp/Patch/exports'
import { sync } from '@typed/fp/Resume/Sync'
import { provideSchedulerEnv } from '@typed/fp/scheduler/exports'
import { createSharedEnvProvider, defaultHandlers } from '@typed/fp/Shared/exports'
import { pipe } from 'fp-ts/function'
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
  // Setup your application to update on requestAnimationFrame
  patchOnRaf(rootElement, Counters),
  createSharedEnvProvider({
    // Provide Event listeners
    handlers: [
      // Provides the handlers required for SharedEnv core, hooks, and context API,
      ...defaultHandlers,
      // Renders patches using the provided WhenIdleEnv to schedule the patches
      ...createWhenIdleHandlers({ ...lighterHtmlPatch, ...whenIdleEnv }),
    ],
  }),
  provideSchedulerEnv,
  execEffect({ ...lighterHtmlPatch, ...rafEnv }),
)
