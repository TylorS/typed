import * as N from '@typed/fp/ID'

import { FromReader, Functor, UseSome } from './fp-ts'

export const getCurrentID = N.getCurrentID({ ...FromReader, ...Functor })
export const usingID = N.usingID(UseSome)
