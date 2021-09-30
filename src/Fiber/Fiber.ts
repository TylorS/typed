import { Branded, fromAssertion } from '@/Branded'
import { Cancelable } from '@/Cancelable'
import { Exit } from '@/Exit'
import * as Fx from '@/Fx'

export interface Fiber<A> extends Cancelable {
  readonly id: FiberId
  readonly exit: Fx.Of<Exit<A>>
  readonly scope: Fx.Of<Fx.Scope>
}

/**
 * A unique identifier for a Fiber. If you are
 */
export type FiberId = Branded<PropertyKey, { readonly FiberId: unique symbol }>
export const FiberId = fromAssertion<FiberId>((x) => {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (typeof x === 'symbol' && !x.description) {
    throw new Error(
      `Only accepts Symbols with a description for your developer experience during debugging.`,
    )
  }
})
