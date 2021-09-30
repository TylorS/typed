import { Fx } from '@/Fx'
import { BaseFx } from '@/Fx/BaseFx'
import { fromInstruction } from '@/Fx/Instruction'
import { Scope } from '@/Fx/Scope'

import { Fiber } from './Fiber'

export type FiberInstruction<R, A> = Fork<R, A> | Join<A> | Kill<A> | GetScope

export class Fork<R, A> extends BaseFx<'Fork', R, Fiber<A>> {
  constructor(readonly fx: Fx<R, A>, readonly scope?: Scope) {
    super('Fork')
  }
}

export class Join<A> extends BaseFx<'Join', unknown, A> {
  constructor(readonly fiber: Fiber<A>) {
    super('Join')
  }
}

export class Kill<A> extends BaseFx<'Kill', unknown, A> {
  constructor(readonly fiber: Fiber<A>) {
    super('Kill')
  }
}

export class GetScope extends BaseFx<'GetScope', unknown, Scope> {
  constructor() {
    super('GetScope')
  }
}

export const getScope = fromInstruction(new GetScope())
