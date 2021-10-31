import { Equals } from 'ts-toolbelt/out/Any/Equals'

/**
 * Effect is a very thin abstraction over Generators which provide the ability to
 * be used more than once by creating a new generator with each call to Symbol.iterator.
 */
export interface Effect<I, R, Next> {
  readonly [Symbol.iterator]: () => Generator<I, R, Next>
}

export class Instr<Type extends PropertyKey, I, O> implements Effect<Instr<Type, I, O>, O, O> {
  constructor(readonly type: Type, readonly input: I) {}

  *[Symbol.iterator](): Generator<this, O, Equals<O, never> extends 1 ? any : O> {
    return yield this
  }
}

export const effect = <Type extends PropertyKey>(
  type: Type,
): new <I, O>(input: I) => Instr<Type, I, O> =>
  class InstructionEffect<I, O> extends Instr<Type, I, O> {
    constructor(input: I) {
      super(type, input)
    }
  }

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const instr =
  <I, O>() =>
  <Type extends PropertyKey>(type: Type) =>
  (input: I): Instr<Type, I, O> =>
    new Instr(type, input)

export type InstrOf<T> = T extends Instr<infer T, infer I, infer O>
  ? Instr<T, I, O>
  : T extends (...args: readonly any[]) => infer R
  ? InstrOf<R>
  : never

export function handle<I, I2, R2, N2>(f: (instruction: I) => Generator<I2, R2, N2>) {
  return <R>(effect: Effect<I, R, R2>): Effect<I2, R, N2> => {
    return {
      *[Symbol.iterator]() {
        const gen = effect[Symbol.iterator]()
        let result = gen.next()

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        while (!result.done) {
          result = gen.next(yield* f(result.value))
        }

        return result.value
      },
    }
  }
}
