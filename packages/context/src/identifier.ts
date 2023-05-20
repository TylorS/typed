export function id<const T>(uniqueIdentifier: T): TaggedIdentifierConstructor<T> {
  return class Tagged implements TaggedIdentifier<T> {
    static readonly _tag: T = uniqueIdentifier
    readonly _tag: T = uniqueIdentifier
  }
}

export interface TaggedIdentifierConstructor<T> extends TaggedIdentifier<T> {
  new (): TaggedIdentifier<T>
}

export interface TaggedIdentifier<T> {
  readonly _tag: T
}
