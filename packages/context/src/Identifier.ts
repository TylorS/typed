/**
 * Helpers for creating unique identifiers for Contextual implementations.
 *
 * Oftentimes you won't need to use these directly, as it is embedded in all of
 * the Contextual implementations.
 *
 * @since 1.0.0
 */

/**
 * Construct a unique identifier for a Contextual implementation.
 * @since 1.0.0
 * @category constructors
 */
export function id<const T>(uniqueIdentifier: T): IdentifierConstructor<T> {
  return class Id implements Identifier<T> {
    static readonly __identifier__: T = uniqueIdentifier
    readonly __identifier__: T = uniqueIdentifier
  }
}

/**
 * A constructor for a unique identifier for a Contextual implementation.
 * @since 1.0.0
 * @category models
 */
export interface IdentifierConstructor<T> extends Identifier<T> {
  new(): Identifier<T>
}

/**
 * A unique identifier for a Contextual implementation.
 * @since 1.0.0
 * @category models
 */
export interface Identifier<T> {
  readonly __identifier__: T
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
/**
 * Extract the Identifier from a Contextual implementation.
 * @since 1.0.0
 * @category type-level
 */
export type IdentifierOf<T> = T extends (_id: typeof id) => IdentifierConstructor<infer _> ? InstanceType<ReturnType<T>>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IdentifierConstructor<infer _> ? InstanceType<T>
  : T

/**
 * A factory for creating a unique identifier for a Contextual implementation.
 * @since 1.0.0
 * @category models
 */
export type IdentifierFactory<T> = (_id: typeof id) => IdentifierConstructor<T>

/**
 * A factory, constructor, or instance of a unique identifier for a Contextual implementation.
 * @since 1.0.0
 * @category models
 */
export type IdentifierInput<T> = IdentifierFactory<T> | IdentifierConstructor<T> | T

/**
 * Convert an identifier to a string.
 * @since 1.0.0
 */
export function identifierToString(x: unknown): string {
  switch (typeof x) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "symbol":
      return String(x)
    case "function":
    case "undefined":
    case "object": {
      if (x == null) return "null"
      if ("__identifier__" in x) return identifierToString(x.__identifier__)
      if ("name" in x) return String(x.name)
      if ("displayName" in x) return String(x.displayName)

      return x.toString()
    }
  }
}

/**
 * Create an Identifier from a factory, constructor, or instance of an Identifier.
 * @since 1.0.0
 */
export function makeIdentifier<T>(input: IdentifierInput<T>): IdentifierOf<T> {
  return (typeof input === "function" && input.length === 1
    ? (input as IdentifierFactory<T>)(id)
    : (input as T)) as IdentifierOf<T>
}
