import { Exit } from '@/Exit'
import * as Fx from '@/Fx'
import { None, Option } from '@/Prelude/Option'

import { Finalizer, FinalizerKey } from './Finalizer'
import type { Scope } from './Scope'

export class GlobalScope {
  readonly type = 'GlobalScope'
  readonly open = true
  readonly released = false
  readonly extend = <E2, B>(scope: Scope<E2, B>) =>
    scope.type === 'GlobalScope' ? true : scope.open ? (scope.refCount.increment(), true) : false
  readonly ensure = (_finalizer: Finalizer): Option<FinalizerKey> => None
  readonly cancel = (_key: FinalizerKey) => false
  readonly close = <E, A>(_exit: Exit<E, A>) => this.release
  readonly release = Fx.of(false)
}

// Since GlobalScope is entirely stateless, we only need one instance
export const globalScope = new GlobalScope()
