export interface Instruction<Tag extends string, I extends InstrParams<any, any, any>> {
  readonly _tag: Tag

  // Type-level ONLY
  readonly _instruction: I
}

export interface InstrParams<R, E, A> {
  readonly _R: (r: R) => void
  readonly _E: () => E
  readonly _A: () => A
}

export type TagOf<A> = A extends Instruction<infer T, any> ? T : never

type InstructionOf<A, Fallback> = [A] extends [Instruction<any, infer T>] ? T : Fallback

export type RequirementsOf<A> = InstructionOf<A, unknown> extends InstrParams<infer R, any, any>
  ? R
  : unknown

export type ErrorOf<A> = InstructionOf<A, never> extends InstrParams<any, infer R, any> ? R : never

export type ValueOf<A> = InstructionOf<A, never> extends InstrParams<any, any, infer R> ? R : never

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function instr<T extends string>(tag: T) {
  return class Instr<R, E, A> implements Instruction<T, InstrParams<R, E, A>> {
    readonly _instruction!: {
      readonly _R: (r: R) => void
      readonly _E: () => E
      readonly _A: () => A
    }

    readonly _tag: T = tag
  }
}
