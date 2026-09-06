type Contra<T> = T extends any ? (arg: T) => void : never;

type InferContra<T> = [T] extends [(arg: infer I) => void] ? I : never;

type PickOne<T> = InferContra<InferContra<Contra<Contra<T>>>>;

/** Converts a union to a tuple so recursive type-level folds can visit each member.
 *
 * @remarks
 * ## Why
 *
 * TypeScript cannot directly reduce a union while accumulating state. This helper repeatedly
 * selects one member through contravariant inference, excludes it, and appends it to a tuple. Typed
 * uses that tuple to merge RefSubject structure kinds.
 *
 * ## Ownership and lifetime
 *
 * This is a compile-time transformation. It emits no JavaScript, acquires no services, and retains
 * no runtime resources.
 *
 * Union member order is an implementation detail of TypeScript inference and must not be used as a
 * stable ordering contract. Very large unions may also reach the compiler's instantiation-depth
 * limit. This published helper follows compiler internals and may change between prereleases.
 *
 * @since 1.0.0
 * @category type-level
 * @stability internal-but-published
 */
export type UnionToTuple<T> =
  PickOne<T> extends infer U
    ? Exclude<T, U> extends never
      ? [T]
      : [...UnionToTuple<Exclude<T, U>>, U]
    : never;
