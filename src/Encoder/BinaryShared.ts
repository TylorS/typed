export enum SupportedType {
  False,
  True,
  Null,
  Undefined,
  UInt8,
  UInt16,
  UInt32,
  Int8,
  Int16,
  Int32,
  Float,
  BigInt,
  String,
  Symbol,
  SymbolDescription,
  SymbolFor,
  Date,
  RegExp,
  ArrayStart,
  ArrayEnd,
  RecordStart,
  RecordEnd,
  SetStart,
  SetEnd,
  MapStart,
  MapEnd,
  Ref,
  CustomStart,
  CustomEnd,
}

export type BinarySerializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | bigint
  | Date
  | RegExp
  | ReadonlyArray<BinarySerializable>
  | ReadonlyMap<BinarySerializable, BinarySerializable>
  | ReadonlySet<BinarySerializable>
  | { readonly [key: PropertyKey]: BinarySerializable }

export interface CustomConstructor<T, Args extends readonly any[]> {
  readonly id: BinarySerializable // Must be UInt8
  readonly is: (x: unknown) => x is T
  readonly encode: (item: T) => Args
  readonly decode: (...args: Args) => T
}

export type CustomTypeOf<T> = T extends CustomConstructor<infer R, any> ? R : never
