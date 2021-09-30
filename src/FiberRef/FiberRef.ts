import { identity, SK } from 'fp-ts/function'

/**
 * FiberRef is a synchronization tool for state.
 */
export class FiberRef<A> {
  constructor(
    readonly id: PropertyKey,
    readonly initial: A,
    readonly fork: (current: A) => A,
    readonly join: (current: A, updated: A) => A,
  ) {}
}

let fiberRefId = 0 // Counter for fallback FiberRefId descriptionss.

export function make<A>(initial: A, options: Partial<FiberRefOptions<A>> = {}): FiberRef<A> {
  return new FiberRef(
    options.id ?? Symbol(`FiberRef${++fiberRefId}`),
    initial,
    options.fork ?? identity,
    options.join ?? SK,
  )
}

export interface FiberRefOptions<A> {
  readonly fork: (current: A) => A
  readonly join: (current: A, updated: A) => A
  readonly id: PropertyKey
}
