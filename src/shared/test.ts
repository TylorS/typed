import { Pure } from '@typed/fp/Effect/exports'

import { fromKey } from './fromKey'

export const SignIn = fromKey<<A>(form: A) => Pure<A>>()('@auth/SignIn')
