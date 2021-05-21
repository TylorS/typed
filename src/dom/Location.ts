import * as E from '@fp/Env'
import { createContext } from '@fp/hooks'

import { LocationEnv } from './env'

export const Location = createContext(
  E.asks((e: LocationEnv) => e.location),
  Symbol('Location'),
)
