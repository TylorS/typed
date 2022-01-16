import { fromPromise } from '@/Effect/FromPromise'
import { Exit } from '@/Exit'

import { Fiber } from './Fiber'
import { InstructionProcessor } from './InstructionProcessor'

export const fromProcessor = <R, E, A>(processor: InstructionProcessor<R, E, A>): Fiber<E, A> => ({
  type: 'RuntimeFiber',
  exit: makeExit(processor),
})

function makeExit<R, E, A>(processor: InstructionProcessor<R, E, A>): Fiber<E, A>['exit'] {
  return fromPromise(() => new Promise<Exit<E, A>>((resolve) => processor.addObserver(resolve)))
}
