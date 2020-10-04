import { isBrowser } from '@typed/fp/common/exports'
import { memo, provideWith, Pure } from '@typed/fp/Effect/exports'

import { createBrowserUuidEnv, createNodeUuidEnv } from './randomUuidSeed/exports'

export const provideUuidEnv = provideWith(
  memo(Pure.fromIO(() => (isBrowser ? createBrowserUuidEnv() : createNodeUuidEnv()))),
)

export const provideBrowserUuidEnv = provideWith(memo(Pure.fromIO(createBrowserUuidEnv)))

export const provideNodeUuidEnv = provideWith(memo(Pure.fromIO(createNodeUuidEnv)))
