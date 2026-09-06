/**
 * Error thrown when a comment marker for a template part cannot be found during hydration.
 *
 * @example
 * ```ts
 * import { CouldNotFindCommentError } from "@typed/template/errors"
 *
 * try {
 *   // Hydration code that might fail
 * } catch (error) {
 *   if (error instanceof CouldNotFindCommentError) {
 *     console.error(`Part ${error.partIndex} comment not found`)
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @category Hydration range failures
 */
export class CouldNotFindCommentError extends Error {
  readonly partIndex: number;
  constructor(partIndex: number) {
    super(`Could not find comment for part ${partIndex}`);
    this.partIndex = partIndex;
  }
}

/**
 * Error thrown when root elements for a template part cannot be found during hydration.
 *
 * @example
 * ```ts
 * import { CouldNotFindRootElement } from "@typed/template/errors"
 *
 * try {
 *   // Hydration code
 * } catch (error) {
 *   if (error instanceof CouldNotFindRootElement) {
 *     console.error(`Root elements for part ${error.partIndex} not found`)
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @category Hydration host failures
 */
export class CouldNotFindRootElement extends Error {
  readonly partIndex: number;
  constructor(partIndex: number) {
    super(`Could not find root elements for part ${partIndex}`);
    this.partIndex = partIndex;
  }
}

/**
 * Error thrown when a comment marker for a `many()` list cannot be found during hydration.
 *
 * @example
 * ```ts
 * import { CouldNotFindManyCommentError } from "@typed/template/errors"
 *
 * try {
 *   // Hydration code for many()
 * } catch (error) {
 *   if (error instanceof CouldNotFindManyCommentError) {
 *     console.error(`Many comment for key ${error.manyIndex} not found`)
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @category Keyed hydration failures
 */
export class CouldNotFindManyCommentError extends Error {
  readonly manyIndex: string;
  constructor(manyIndex: string) {
    super(`Could not find comment for many part ${manyIndex}`);
    this.manyIndex = manyIndex;
  }
}

/**
 * Error thrown when a template hash cannot be found in the DOM during hydration.
 *
 * @example
 * ```ts
 * import { CouldNotFindTemplateHashError } from "@typed/template/errors"
 *
 * try {
 *   // Hydration code
 * } catch (error) {
 *   if (error instanceof CouldNotFindTemplateHashError) {
 *     console.error(`Template hash ${error.hash} not found`)
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @category Template identity failures
 */
export class CouldNotFindTemplateHashError extends Error {
  readonly hash: string;
  constructor(hash: string) {
    super(`Could not find template hash ${hash}`);
    this.hash = hash;
  }
}

/**
 * Error thrown when the end marker of a template cannot be found during hydration.
 *
 * @example
 * ```ts
 * import { CouldNotFindTemplateEndError } from "@typed/template/errors"
 *
 * try {
 *   // Hydration code
 * } catch (error) {
 *   if (error instanceof CouldNotFindTemplateEndError) {
 *     console.error(`End of template ${error.hash} not found`)
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @category Hydration range failures
 */
export class CouldNotFindTemplateEndError extends Error {
  readonly hash: string;
  constructor(hash: string) {
    super(`Could not find end of template for hash ${hash}`);
    this.hash = hash;
  }
}

const constructors = [
  CouldNotFindCommentError,
  CouldNotFindRootElement,
  CouldNotFindManyCommentError,
  CouldNotFindTemplateHashError,
  CouldNotFindTemplateEndError,
] as const;

/**
 * A union type of all hydration-related errors.
 *
 * @since 1.0.0
 * @category Hydration failures
 */
export type HydrationError = InstanceType<(typeof constructors)[number]>;

/**
 * Checks if an error is a hydration error.
 *
 * @example
 * ```ts
 * import { isHydrationError } from "@typed/template/errors"
 *
 * try {
 *   // Hydration code
 * } catch (error) {
 *   if (isHydrationError(error)) {
 *     console.error("Hydration failed:", error)
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @category Hydration failure recognition
 */
export function isHydrationError(e: unknown): e is HydrationError {
  return constructors.some((c) => e instanceof c);
}
