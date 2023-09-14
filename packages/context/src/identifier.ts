export function id<const T>(uniqueIdentifier: T): IdentifierConstructor<T> {
  return class Id implements Identifier<T> {
    static readonly __identifier__: T = uniqueIdentifier
    readonly __identifier__: T = uniqueIdentifier
  }
}

export interface IdentifierConstructor<T> extends Identifier<T> {
  new(): Identifier<T>
}

export interface Identifier<T> {
  readonly __identifier__: T
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type IdentifierOf<T> = T extends (_id: typeof id) => IdentifierConstructor<infer _> ? InstanceType<ReturnType<T>>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IdentifierConstructor<infer _> ? InstanceType<T>
  : T

export type IdentifierFactory<T> = (_id: typeof id) => IdentifierConstructor<T>

export type IdentifierInput<T> = IdentifierFactory<T> | IdentifierConstructor<T> | T

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

export function makeIdentifier<T>(input: IdentifierInput<T>): IdentifierOf<T> {
  return (typeof input === "function" && input.length === 1
    ? (input as IdentifierFactory<T>)(id)
    : (input as T)) as IdentifierOf<T>
}
