export const possibleLengths: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export type PossibleLength = typeof possibleLengths[number]

export type TypeParam = StaticTypeParam | HktTypeParam

export class StaticTypeParam {
  readonly tag = 'StaticTypeParam'
  readonly id = Symbol('StaticTypeParam')

  constructor(readonly label: string, readonly extension?: string) {}
}

export class HktTypeParam {
  readonly tag = 'HktTypeParam'
  readonly id = Symbol('HktTypeParam')

  constructor(readonly label: string, readonly size: PossibleLength = 1) {}
}

export type FunctionArgument =
  | StaticArgument
  | TypeClassArgument
  | DynamicArgument<readonly TypeParam[]>
  | KindNode

export class StaticArgument {
  readonly tag = 'StaticArgument'
  readonly id = Symbol('StaticArgument')

  constructor(readonly label: string, readonly type: string) {}
}

export class TypeClassArgument {
  readonly tag = 'TypeClassArgument'
  readonly id = Symbol('TypeClassArgument')

  constructor(
    readonly label: string,
    readonly typeClass: string,
    readonly typeParams: readonly TypeParam[],
    readonly size: number = 1,
  ) {}
}

export class KindNode {
  readonly tag = 'KindNode'
  readonly id = Symbol('KindNode')

  constructor(
    readonly label: string,
    readonly hkt: HktTypeParam,
    readonly params: ReadonlyArray<TypeParam | KindNode | FunctionSignature>,
    readonly size: number = 1,
  ) {}
}

export class DynamicArgument<Params extends readonly TypeParam[]> {
  readonly tag = 'DynamicArgument'
  readonly id = Symbol('DynamicArgument')

  constructor(
    readonly label: string,
    readonly typeParams: Params,
    readonly template: (...params: { [K in keyof Params]: string }) => string,
  ) {}
}

export class StaticReturnSignature {
  readonly tag = 'StaticReturnSignature'
  readonly id = Symbol('StaticReturnSignature')

  constructor(readonly type: string, readonly params: readonly TypeParam[]) {}
}

export type Value = DynamicValue<readonly TypeParam[]>

export class RecordNode {
  readonly tag = 'RecordNode'
  readonly id = Symbol('RecordNode')

  constructor(
    readonly key: string,
    readonly value: Value,
    readonly keyParam?: TypeParam,
    readonly keyOf: boolean = false,
  ) {}
}

export class TupleNode {
  readonly tag = 'TupleNode'
  readonly id = Symbol('TupleNode')

  constructor(readonly values: readonly Value[]) {}
}

export class DynamicValue<Params extends readonly TypeParam[]> {
  readonly tag = 'DynamicValue'
  readonly id = Symbol('DynamicValue')

  constructor(
    readonly typeParams: Params,
    readonly template: (params: readonly string[]) => string,
  ) {}
}

export type HktReturnSignatureParam = TypeParam | RecordNode | TupleNode | HktReturnSignature

export class HktReturnSignature {
  readonly tag = 'HktReturnSignature'
  readonly id = Symbol('HktReturnSignature')

  constructor(
    readonly type: HktTypeParam,
    readonly params: ReadonlyArray<HktReturnSignatureParam>,
    readonly size: number = 1,
  ) {}
}

export type ReturnSignature = StaticReturnSignature | HktReturnSignature | FunctionSignature

export class FunctionSignature {
  readonly tag = 'FunctionSignature'
  readonly id = Symbol('FunctionSignature')

  constructor(
    readonly exported: boolean,
    readonly name: string,
    readonly params: readonly TypeParam[],
    readonly args: readonly FunctionArgument[],
    readonly returnSignature: ReturnSignature,
  ) {}
}

export class InterfaceNode {
  readonly tag = 'InterfaceNode'
  readonly id = Symbol('InterfaceNode')

  constructor(
    readonly name: string,
    readonly params: readonly TypeParam[],
    readonly properties: ReadonlyArray<readonly [key: string, value: PropertyValue]>,
  ) {}
}

export type PropertyValue = Value | FunctionSignature
