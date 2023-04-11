export function id<const T>(uniqueIdentifier: T) {
  return class {
    static readonly _tag = uniqueIdentifier
    readonly _tag = uniqueIdentifier
  }
}
