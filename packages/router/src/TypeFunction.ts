/**
 * A unary function evaluated by TypeScript rather than JavaScript.
 *
 * @since 1.0.0
 * @category Type function contracts
 */
export interface TypeFunction<in Input = any, out Output = any> {
  readonly signature: (input: Input) => Output;
}

/**
 * Extracts the input supplied to a type function.
 *
 * @since 1.0.0
 * @category Type function application
 */
export type InputOf<F extends TypeFunction<never, unknown>> = F extends {
  readonly argument: (_: infer Input) => void;
}
  ? Input
  : Parameters<F["signature"]>[0];

/**
 * Applies a unary type function to an input.
 *
 * @since 1.0.0
 * @category Type function application
 */
export type Apply<F extends TypeFunction<never, unknown>, Input> = F & {
  readonly argument: (_: Input extends Parameters<F["signature"]>[0] ? Input : never) => void;
} extends infer Applied extends { readonly return: unknown }
  ? Applied["return"]
  : never;

/**
 * The identity type function.
 *
 * @since 1.0.0
 * @category Type function application
 */
export interface Identity extends TypeFunction {
  readonly return: InputOf<this>;
}

/**
 * Applies up to five unary type functions from left to right.
 *
 * @since 1.0.0
 * @category Type function application
 */
export type Pipe<
  Input,
  A extends TypeFunction<never, unknown>,
  B extends TypeFunction<never, unknown> = never,
  C extends TypeFunction<never, unknown> = never,
  D extends TypeFunction<never, unknown> = never,
  E extends TypeFunction<never, unknown> = never,
> = [B] extends [never]
  ? Apply<A, Input>
  : [C] extends [never]
    ? Apply<B, Apply<A, Input>>
    : [D] extends [never]
      ? Apply<C, Apply<B, Apply<A, Input>>>
      : [E] extends [never]
        ? Apply<D, Apply<C, Apply<B, Apply<A, Input>>>>
        : Apply<E, Apply<D, Apply<C, Apply<B, Apply<A, Input>>>>>;
