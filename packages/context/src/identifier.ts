export function id<const T>(uniqueIdentifier: T): IdentifierConstructor<T> {
  return class Id implements Identifier<T> {
    static readonly _id: T = uniqueIdentifier
    readonly _id: T = uniqueIdentifier
  }
}

export interface IdentifierConstructor<T> extends Identifier<T> {
  new (): Identifier<T>
}

export interface Identifier<T> {
  readonly _id: T
}
