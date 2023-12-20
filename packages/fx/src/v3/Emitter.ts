import type { Cause, Exit } from "effect"

export interface Emitter<E, A> {
  readonly succeed: (value: A) => Promise<Exit.Exit<never, void>>
  readonly failCause: (cause: Cause.Cause<E>) => Promise<Exit.Exit<never, void>>
  readonly fail: (error: E) => Promise<Exit.Exit<never, void>>
  readonly die: (error: unknown) => Promise<Exit.Exit<never, void>>
  readonly end: () => Promise<Exit.Exit<never, void>>
}
