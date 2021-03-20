import * as N from '@typed/fp/Namespace'
import { FromReader, Functor } from 'fp-ts/dist/Reader'

import { UseSome } from './provide'

export const getCurrentNamespace = N.getCurrentNamespace({ ...FromReader, ...Functor })
export const usingNamespace = N.usingNamespace(UseSome)
