import { fromLazy } from '@/Effect'
import { run, Sync } from '@/Prelude/Sync'

import { Of } from './Fx'

export const fromSync = <A>(sync: Sync<A>): Of<A> => fromLazy(() => run(sync))
