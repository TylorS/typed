import { Option } from 'fp-ts/Option'

import { Async } from '@/Async'

export interface AsyncOption<A> extends Async<Option<A>> {}
