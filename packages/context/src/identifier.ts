export function id<const T>(uniqueIdentifier: T): TaggedIdentifierConstructor<readonly [], T> {
  return class Tagged implements TaggedIdentifier<T> {
    static readonly _tag: T = uniqueIdentifier
    readonly _tag: T = uniqueIdentifier
  }
}

export interface TaggedIdentifierConstructor<Args extends readonly any[], T> {
  readonly _tag: T
  new (...args: Args): TaggedIdentifier<T>
}

export interface TaggedIdentifier<T> {
  readonly _tag: T
}
