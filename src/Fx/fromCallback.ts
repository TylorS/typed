import * as A from '@/Prelude/Async'
import { flow } from '@/Prelude/function'

import { fromAsync } from './Effect'

export const fromCallback = flow(A.fromCallback, fromAsync)
