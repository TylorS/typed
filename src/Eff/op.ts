import { op as op_ } from '@typed/fp/Env'
import { Resume } from '@typed/fp/Resume'

import { fromEnv } from './Eff'

export const op = <Op>() => <K extends PropertyKey>(key: K) => <A>(f: (value: Op) => Resume<A>) =>
  fromEnv(op_<Op>()(key)(f))
