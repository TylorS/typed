import * as Fiber from '@effect/io/Fiber'

export class StaticTextPart {
  readonly _tag = 'StaticText' as const

  // Can be used to track resources for a given Part.
  public fibers: Set<Fiber.Fiber<never, unknown>> = new Set()

  constructor(readonly text: string) {}
}
