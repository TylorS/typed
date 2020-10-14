import { memo, provideWith, Pure } from '@typed/fp/Effect/exports'

import { createNodeUuidEnv } from './randomUuidSeed/createNodeUuidEnv'

export const provideNodeUuidEnv = provideWith(memo(Pure.fromIO(createNodeUuidEnv)))
