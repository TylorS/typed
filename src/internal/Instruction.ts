export interface Instruction<Tag extends string, I extends InstrParams<any, any, any>> {
  readonly _tag: Tag

  // Type-level ONLY
  readonly _instruction?: I
}

export interface InstrParams<R, E, A> {
  readonly _R?: (r: R) => void
  readonly _E?: () => E
  readonly _A?: () => A
}

export type TagOf<A> = A extends Instruction<infer T, any> ? T : never

type InstructionOf<A, I extends 0 | 1 | 2, Fallback> = A extends Instruction<
  any,
  InstrParams<infer R, infer E, infer B>
>
  ? [R, E, B][I]
  : Fallback

export type RequirementsOf<A> = InstructionOf<A, 0, unknown>

export type ErrorOf<A> = InstructionOf<A, 1, never>

export type ValueOf<A> = InstructionOf<A, 2, never>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function instr<T extends string>(tag: T) {
  return class Instr<R, E, A> implements Instruction<T, InstrParams<R, E, A>> {
    readonly _tag: T = tag
  }
}
