export function id<const T>(uniqueIdentifier: T): TaggedConstructor<T> {
  return class Identifier implements Tagged<T> {
    static readonly _tag: T = uniqueIdentifier
    readonly _tag: T = uniqueIdentifier
  }
}

export interface TaggedConstructor<T> extends Tagged<T> {
  new (): Tagged<T>
}

export interface Tagged<T> {
  readonly _tag: T
}
