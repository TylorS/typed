import * as N from '@typed/fp/ID'
import { FromReader, Functor } from 'fp-ts/dist/Reader'

import { UseSome } from './provide'

export const getCurrentID = N.getCurrentID({ ...FromReader, ...Functor })
export const usingID = N.usingID(UseSome)
