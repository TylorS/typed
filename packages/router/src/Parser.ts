import type { Apply, InputOf, Pipe, TypeFunction } from "./TypeFunction.js";

/**
 * A parsed value paired with the unconsumed string suffix.
 *
 * @remarks
 * ## Why
 * Every parser can compose without hiding partial consumption.
 *
 * ## Ownership and lifetime
 * `Result` is a compile-time tuple contract; neither the parsed value nor remaining-input type creates a runtime allocation.
 *
 * @example
 * ```ts
 * import type { Parse, Parser } from "@typed/router/Parser"
 *
 * type Parsed = Parse<Parser.String<"users">, "users/42">
 * // readonly ["users", "/42"]
 * ```
 *
 * @since 1.0.0
 * @category Parser contracts
 */
export type Result<Value, Rest extends string> = readonly [value: Value, rest: Rest];

/**
 * A type lambda from a string literal to a parse result.
 *
 * @remarks
 * ## Why
 * Route grammar can be evaluated in TypeScript while mirroring the runtime parser.
 *
 * ## Ownership and lifetime
 * `Parser` is an HKT protocol evaluated by TypeScript. Implementing it creates no runtime parser object or subscription.
 *
 * @since 1.0.0
 * @category Parser contracts
 */
export interface Parser<Output = unknown> extends TypeFunction<string, Result<Output, string>> {}

/**
 * Applies a type-level Parser to a string literal input.
 *
 * @remarks
 * ## Why
 * Consumers can expose parser results without depending on the internal type-function spelling.
 *
 * ## Ownership and lifetime
 * TypeScript instantiates `Parse` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
 *
 * @since 1.0.0
 * @category Parser contracts
 */
export type Parse<P extends Parser<unknown>, Input extends string> = Apply<P, Input>;

type IsStringLiteral<T extends string> = string extends T ? false : true;

type StrictEquals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type IsNoProgress<Input extends string, Rest extends string> =
  IsStringLiteral<Input> extends true ? StrictEquals<Input, Rest> : false;

export declare namespace Parser {
  /**
   * A Parser whose output is intentionally widened to unknown.
   *
   * @remarks
   * ## Why
   * Heterogeneous combinators can constrain parser shape without inventing an output type.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Any` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser contracts
   */
  export type Any = Parser<unknown>;

  /**
   * Runs a Parser against a string literal input.
   *
   * @remarks
   * ## Why
   * Namespace users get a direct evaluation alias alongside `Parse`.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Run` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser contracts
   */
  export type Run<P extends Any, Input extends string> = Apply<P, Input>;

  /**
   * Succeeds with a constant value without consuming input.
   *
   * @remarks
   * ## Why
   * It supplies values to larger parser compositions while retaining the original suffix.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Succeed` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser primitives
   */
  export interface Succeed<A> extends TypeFunction<string, Result<A, string>> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `Succeed.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser primitives
     */
    readonly return: InputOf<this> extends infer Input extends string ? readonly [A, Input] : never;
  }

  /**
   * A parser that always produces `never`.
   *
   * @remarks
   * ## Why
   * Failure is the branch-selection signal used by type-level alternatives.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Fail` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser primitives
   */
  export interface Fail extends TypeFunction<string, never> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `Fail.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser primitives
     */
    readonly return: never;
  }

  /**
   * Consumes one exact leading character.
   *
   * @remarks
   * ## Why
   * Atomic character matching builds route punctuation parsers without widening input.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Char` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser primitives
   */
  export interface Char<C extends string> extends TypeFunction<string, Result<C, string>> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `Char.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser primitives
     */
    readonly return: InputOf<this> extends `${C}${infer Rest}` ? readonly [C, Rest] : never;
  }

  /**
   * Consumes one exact leading string literal.
   *
   * @remarks
   * ## Why
   * Multi-character tokens remain atomic in composed grammars.
   *
   * ## Ownership and lifetime
   * TypeScript recursively instantiates `TakeWhileInternal` while characters remain allowed. Its
   * accumulator and remainder are erased after type checking.
   *
   * @since 1.0.0
   * @category Parser primitives
   */
  export interface String<S extends string> extends TypeFunction<string, Result<S, string>> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `String.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser primitives
     */
    readonly return: InputOf<this> extends `${S}${infer Rest}` ? readonly [S, Rest] : never;
  }

  /**
   * The lowercase ASCII character union.
   *
   * @remarks
   * ## Why
   * The parser avoids widening literal route names to arbitrary strings.
   *
   * ## Ownership and lifetime
   * `LowercaseAlphabet` is a string-literal union used only during compiler evaluation and is erased from emitted JavaScript.
   *
   * @since 1.0.0
   * @category Parser primitives
   */
  export type LowercaseAlphabet =
    | "a"
    | "b"
    | "c"
    | "d"
    | "e"
    | "f"
    | "g"
    | "h"
    | "i"
    | "j"
    | "k"
    | "l"
    | "m"
    | "n"
    | "o"
    | "p"
    | "q"
    | "r"
    | "s"
    | "t"
    | "u"
    | "v"
    | "w"
    | "x"
    | "y"
    | "z";

  /**
   * The uppercase ASCII character union.
   *
   * @remarks
   * ## Why
   * The parser avoids widening literal route names to arbitrary strings.
   *
   * ## Ownership and lifetime
   * `UppercaseAlphabet` is a string-literal union used only during compiler evaluation and is erased from emitted JavaScript.
   *
   * @since 1.0.0
   * @category Parser primitives
   */
  export type UppercaseAlphabet =
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | "F"
    | "G"
    | "H"
    | "I"
    | "J"
    | "K"
    | "L"
    | "M"
    | "N"
    | "O"
    | "P"
    | "Q"
    | "R"
    | "S"
    | "T"
    | "U"
    | "V"
    | "W"
    | "X"
    | "Y"
    | "Z";

  /**
   * The ASCII uppercase and lowercase character union.
   *
   * @remarks
   * ## Why
   * Route parameter names use an explicit compile-time alphabet.
   *
   * ## Ownership and lifetime
   * `Alphabet` is a string-literal union used only during compiler evaluation and is erased from emitted JavaScript.
   *
   * @since 1.0.0
   * @category Parser primitives
   */
  export type Alphabet = LowercaseAlphabet | UppercaseAlphabet;

  /**
   * The decimal digit character union.
   *
   * @remarks
   * ## Why
   * Numeric characters participate in parameter names without becoming number values.
   *
   * ## Ownership and lifetime
   * `Digit` is a string-literal union used only during compiler evaluation and is erased from emitted JavaScript.
   *
   * @since 1.0.0
   * @category Parser primitives
   */
  export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

  /**
   * The ASCII alphabet-or-digit character union.
   *
   * @remarks
   * ## Why
   * Parameter name parsing shares one exact allowed-character set.
   *
   * ## Ownership and lifetime
   * `AlphaNumeric` is a string-literal union used only during compiler evaluation and is erased from emitted JavaScript.
   *
   * @since 1.0.0
   * @category Parser primitives
   */
  export type AlphaNumeric = Alphabet | Digit;

  /**
   * Recursively consumes an allowed character prefix at the type level.
   *
   * @remarks
   * ## Why
   * The public TakeWhile combinator preserves both the accumulated prefix and exact remainder.
   *
   * ## Ownership and lifetime
   * TypeScript recursively instantiates `TakeWhileInternal` while characters remain allowed. Its
   * accumulator and remainder are erased after type checking.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  type TakeWhileInternal<
    Input extends string,
    Allowed extends string,
    Acc extends string = "",
  > = Input extends `${infer Head}${infer Tail}`
    ? Head extends Allowed
      ? TakeWhileInternal<Tail, Allowed, `${Acc}${Head}`>
      : readonly [Acc, Input]
    : readonly [Acc, Input];

  /**
   * Requires the type-level allowed-character prefix to be non-empty.
   *
   * @remarks
   * ## Why
   * TakeWhile1 can distinguish failure from a successful empty match.
   *
   * ## Ownership and lifetime
   * `TakeWhile1Internal` exists only during type checking and reuses `TakeWhileInternal`'s result;
   * it creates no runtime validation or retained prefix.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  type TakeWhile1Internal<Input extends string, Allowed extends string> =
    TakeWhileInternal<Input, Allowed> extends readonly [
      infer Taken extends string,
      infer Rest extends string,
    ]
      ? Taken extends ""
        ? never
        : readonly [Taken, Rest]
      : never;

  /**
   * Consumes zero or more characters from an allowed union.
   *
   * @remarks
   * ## Why
   * It preserves the precise consumed prefix and remaining suffix.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `TakeWhile` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  export interface TakeWhile<Allowed extends string> extends TypeFunction<
    string,
    Result<string, string>
  > {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `TakeWhile.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser repetition
     */
    readonly return: InputOf<this> extends infer Input extends string
      ? TakeWhileInternal<Input, Allowed>
      : never;
  }

  /**
   * Consumes one or more allowed characters and fails on an empty prefix.
   *
   * @remarks
   * ## Why
   * Required route names cannot silently parse as empty strings.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `TakeWhile1` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  export interface TakeWhile1<Allowed extends string> extends TypeFunction<
    string,
    Result<string, string>
  > {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `TakeWhile1.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser repetition
     */
    readonly return: InputOf<this> extends infer Input extends string
      ? TakeWhile1Internal<Input, Allowed>
      : never;
  }

  /**
   * Transforms a successful parser value without changing its remaining input.
   *
   * @remarks
   * ## Why
   * Value construction stays separate from input consumption.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Map` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface Map<P extends Any, F extends TypeFunction> extends Parser<unknown> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `Map.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer Input extends string
      ? Apply<P, Input> extends infer R
        ? [R] extends [never]
          ? never
          : R extends readonly [infer Value, infer Rest extends string]
            ? readonly [Pipe<Value, F>, Rest]
            : never
        : never
      : never;
  }

  /**
   * Selects the next Parser from a successful value and continues at the remaining input.
   *
   * @remarks
   * ## Why
   * Dependent grammar remains expressible without losing failure or remainder information.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `FlatMap` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface FlatMap<P extends Any, F extends TypeFunction> extends Parser<unknown> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `FlatMap.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer Input extends string
      ? Apply<P, Input> extends infer R
        ? [R] extends [never]
          ? never
          : R extends readonly [infer Value, infer Rest extends string]
            ? Pipe<Value, F> extends infer Next
              ? [Next] extends [never]
                ? never
                : Next extends Any
                  ? Pipe<Rest, Next>
                  : never
              : never
            : never
        : never
      : never;
  }

  /**
   * Runs two parsers sequentially and returns both values.
   *
   * @remarks
   * ## Why
   * Ordered grammar composition passes the first parser's remainder into the second.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Zip` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface Zip<P extends Any, Q extends Any> extends Parser<unknown> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `Zip.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer Input extends string
      ? Apply<P, Input> extends infer R1
        ? [R1] extends [never]
          ? never
          : R1 extends readonly [infer Value1, infer Rest1 extends string]
            ? Pipe<Rest1, Q> extends infer R2
              ? [R2] extends [never]
                ? never
                : R2 extends readonly [infer Value2, infer Rest2 extends string]
                  ? readonly [readonly [Value1, Value2], Rest2]
                  : never
              : never
            : never
        : never
      : never;
  }

  /**
   * Runs the fallback parser from the original input when the first parser fails.
   *
   * @remarks
   * ## Why
   * Alternatives do not leak partial consumption from a rejected branch.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `OrElse` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface OrElse<P extends Any, Q extends Any> extends Parser<unknown> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `OrElse.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer Input extends string
      ? Apply<P, Input> extends infer R
        ? [R] extends [never]
          ? Pipe<Input, Q>
          : R extends readonly [infer Value, infer Rest extends string]
            ? readonly [Value, Rest]
            : never
        : never
      : never;
  }

  /**
   * Returns `undefined` and the original input when its parser fails.
   *
   * @remarks
   * ## Why
   * Optional grammar does not consume input on the absent branch.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Optional` while parsing a string-literal input. Its present or absent
   * result and unchanged failure remainder exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface Optional<P extends Any> extends Parser<unknown> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `Optional.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer Input extends string
      ? Apply<P, Input> extends infer R
        ? [R] extends [never]
          ? readonly [undefined, Input]
          : R extends readonly [infer Value, infer Rest extends string]
            ? readonly [Value, Rest]
            : never
        : never
      : never;
  }

  /**
   * Recursively repeats a Parser while it succeeds and consumes input.
   *
   * @remarks
   * ## Why
   * The no-progress check prevents non-terminating type instantiation for parsers that retain input.
   *
   * ## Ownership and lifetime
   * `ManyInternal` accumulates values and remaining input only in compiler state. The no-progress
   * branch terminates type evaluation without creating a runtime loop.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  type ManyInternal<
    P extends Any,
    Input extends string,
    Acc extends ReadonlyArray<unknown> = readonly [],
  > =
    Apply<P, Input> extends infer R
      ? [R] extends [never]
        ? readonly [Acc, Input]
        : R extends readonly [infer Value, infer Rest extends string]
          ? IsNoProgress<Input, Rest> extends true
            ? never
            : ManyInternal<P, Rest, readonly [...Acc, Value]>
          : never
      : never;

  /**
   * Runs one required repetition before delegating to zero-or-more parsing.
   *
   * @remarks
   * ## Why
   * Many1 fails when the first parse fails or makes no progress.
   *
   * ## Ownership and lifetime
   * `Many1Internal` performs its required first parse only in TypeScript's type system, then delegates
   * to `ManyInternal`; no runtime parser value exists.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  type Many1Internal<P extends Any, Input extends string> =
    Apply<P, Input> extends infer R
      ? [R] extends [never]
        ? never
        : R extends readonly [infer Value, infer Rest extends string]
          ? IsNoProgress<Input, Rest> extends true
            ? never
            : ManyInternal<P, Rest, readonly [Value]>
          : never
      : never;

  /**
   * Repeats a parser until failure and returns every value.
   *
   * @remarks
   * ## Why
   * Repetition preserves the first unconsumed suffix and rejects parsers that make no progress.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Many` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  export interface Many<P extends Any> extends Parser<unknown> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `Many.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser repetition
     */
    readonly return: InputOf<this> extends infer Input extends string
      ? ManyInternal<P, Input>
      : never;
  }

  /**
   * Repeats a parser at least once.
   *
   * @remarks
   * ## Why
   * Required repetitions fail rather than returning an empty collection.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Many1` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  export interface Many1<P extends Any> extends Parser<unknown> {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `Many1.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser repetition
     */
    readonly return: InputOf<this> extends infer Input extends string
      ? Many1Internal<P, Input>
      : never;
  }

  /**
   * Binds a Parser and mapping lambda for reuse as a type lambda.
   *
   * @remarks
   * ## Why
   * Higher-order grammar can receive a preconfigured mapping operation.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `MapTo` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface MapTo<F extends TypeFunction> extends TypeFunction {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `MapTo.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer P extends Any ? Map<P, F> : never;
  }

  /**
   * Binds a Parser and dependent mapping lambda for reuse.
   *
   * @remarks
   * ## Why
   * Higher-order grammar can defer dependent parsing while fixing its first stage.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `FlatMapTo` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface FlatMapTo<F extends TypeFunction> extends TypeFunction {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `FlatMapTo.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer P extends Any ? FlatMap<P, F> : never;
  }

  /**
   * Binds a second Parser for later sequential composition.
   *
   * @remarks
   * ## Why
   * Reusable products preserve left-to-right input consumption.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `ZipWith` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface ZipWith<Q extends Any> extends TypeFunction {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `ZipWith.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer P extends Any ? Zip<P, Q> : never;
  }

  /**
   * Binds a fallback Parser for later composition.
   *
   * @remarks
   * ## Why
   * Reusable alternatives preserve the original-input fallback rule.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `OrElseWith` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface OrElseWith<Q extends Any> extends TypeFunction {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `OrElseWith.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer P extends Any ? OrElse<P, Q> : never;
  }

  /**
   * Binds a Parser for optional evaluation.
   *
   * @remarks
   * ## Why
   * Higher-order grammar can reuse the no-consumption absent branch.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `OptionalOf` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser composition
   */
  export interface OptionalOf extends TypeFunction {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `OptionalOf.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser composition
     */
    readonly return: InputOf<this> extends infer P extends Any ? Optional<P> : never;
  }

  /**
   * Binds the repeated Parser for zero-or-more evaluation.
   *
   * @remarks
   * ## Why
   * Higher-order grammar can reuse repetition without restating its input type.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `ManyOf` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  export interface ManyOf extends TypeFunction {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `ManyOf.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser repetition
     */
    readonly return: InputOf<this> extends infer P extends Any ? Many<P> : never;
  }

  /**
   * Binds the repeated Parser for one-or-more evaluation.
   *
   * @remarks
   * ## Why
   * Higher-order grammar can require progress and at least one value.
   *
   * ## Ownership and lifetime
   * TypeScript instantiates `Many1Of` while parsing a string-literal input; partial results and unconsumed text exist only in the resulting type.
   *
   * @since 1.0.0
   * @category Parser repetition
   */
  export interface Many1Of extends TypeFunction {
    /**
     * Computes this type lambda's parse result for its current input.
     *
     * @remarks
     * ## Why
     * The local type-function protocol evaluates each parser combinator through this member without a parallel runtime object.
     *
     * ## Ownership and lifetime
     * TypeScript evaluates `Many1Of.return` when the surrounding parser is applied; the associated result is erased and retains no input at runtime.
     *
     * @since 1.0.0
     * @category Parser repetition
     */
    readonly return: InputOf<this> extends infer P extends Any ? Many1<P> : never;
  }
}
