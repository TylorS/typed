import { memo, provideWith, Pure } from '@typed/fp/Effect/exports'

import { createBrowserUuidEnv } from './randomUuidSeed/exports'

export const provideBrowserUuidEnv = provideWith(memo(Pure.fromIO(createBrowserUuidEnv)))
