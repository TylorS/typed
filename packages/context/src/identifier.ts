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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type IdentifierOf<T> = T extends IdentifierConstructor<infer _> ? InstanceType<T> : T

export function identifierToString(x: unknown): string {
  switch (typeof x) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
    case 'symbol':
      return String(x)
    case 'function':
      return String((x as any).displayName || x.name)
    case 'undefined':
    case 'object': {
      if (x == null) return 'null'
      if ('name' in x) return String(x.name)
      if ('displayName' in x) return String(x.displayName)
      if ('_id' in x) return identifierToString(x._id)

      return x.toString()
    }
  }
}
