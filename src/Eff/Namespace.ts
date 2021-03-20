import * as N from '@typed/fp/Namespace'

import { FromReader, Functor, UseSome } from './fp-ts'

export const getCurrentNamespace = N.getCurrentNamespace({ ...FromReader, ...Functor })
export const usingNamespace = N.usingNamespace(UseSome)
