import type { Context } from './Context'

export type ParentNode = FunctionSignature | Interface | TypeAlias

export type AST =
  | Interface
  | InterfaceProperty
  | TypeAlias
  | FunctionSignature
  | TypeParam
  | FunctionParam
  | KindParam
  | ObjectProperty
  | FunctionReturnSignature

export const ast = <T extends string>(tag: T) =>
  class Node {
    static tag = tag
    readonly tag = tag
    readonly id = Symbol(tag)
  }

export class Interface extends ast('Interface') {
  constructor(
    readonly name: string,
    readonly typeParams: ReadonlyArray<TypeParam>,
    readonly properties: ReadonlyArray<InterfaceProperty>,
    readonly extensions: ReadonlyArray<KindParam | Interface> = [],
  ) {
    super()
  }
}

export class InterfaceProperty extends ast('InterfaceProperty') {
  constructor(readonly name: string, readonly signature: FunctionSignature) {
    super()
  }
}

export class TypeAlias extends ast('TypeAlias') {
  constructor(
    readonly name: string,
    readonly typeParams: ReadonlyArray<TypeParam>,
    readonly signature: FunctionReturnSignature,
  ) {
    super()
  }
}

export class FunctionSignature extends ast('FunctionSignature') {
  constructor(
    readonly name: string,
    readonly typeParams: ReadonlyArray<TypeParam>,
    readonly functionParams: ReadonlyArray<FunctionParam>,
    readonly returnSignature: FunctionReturnSignature,
  ) {
    super()
  }
}

export type TypeParam = HKTParam | HKTPlaceholder | StaticTypeParam | Typeclass | DynamicTypeParam

export class HKTParam extends ast('HKTParam') {
  constructor(readonly name: string, readonly size = 0) {
    super()
  }
}

export class HKTPlaceholder extends ast('HKTPlaceholder') {
  constructor(readonly type: HKTParam, readonly useDefaults: boolean = false) {
    super()
  }
}

export class StaticTypeParam extends ast('StaticTypeParam') {
  constructor(readonly type: string, readonly extension?: string, readonly defaultValue?: string) {
    super()
  }
}

export class Typeclass extends ast('Typeclass') {
  constructor(readonly label: string, readonly name: string, readonly type: HKTParam) {
    super()
  }
}

export class DynamicTypeParam extends ast('DynamicTypeParam') {
  constructor(
    readonly params: readonly KindParam[],
    readonly template: (typeParams: readonly string[], context: Context) => string,
  ) {
    super()
  }
}

export type FunctionParam =
  | StaticFunctionParam
  | DynamicFunctionParam
  | Kind
  | Typeclass
  | FunctionSignature

export class StaticFunctionParam extends ast('StaticFunctionParam') {
  constructor(readonly label: string, readonly type: string) {
    super()
  }
}

export class DynamicFunctionParam extends ast('DynamicFunctionParam') {
  constructor(
    readonly label: string,
    readonly typeParams: readonly TypeParam[],
    readonly template: (typeParams: readonly string[], context: Context) => string,
  ) {
    super()
  }
}

export class Kind extends ast('Kind') {
  constructor(
    readonly label: string,
    readonly type: HKTParam,
    readonly typeParams: ReadonlyArray<KindParam>,
  ) {
    super()
  }
}

export type KindParam = TypeParam | Kind | Tuple | ObjectNode | StaticNode

export type FunctionReturnSignature =
  | FunctionSignature
  | KindReturn
  | StaticReturn
  | TupleReturn
  | DynamicTypeParam

export class KindReturn extends ast('KindReturn') {
  constructor(readonly type: HKTParam, readonly typeParams: ReadonlyArray<KindParam>) {
    super()
  }
}

export class StaticReturn extends ast('StaticReturn') {
  constructor(readonly type: string, readonly params: readonly TypeParam[]) {
    super()
  }
}

export class Tuple extends ast('Tuple') {
  constructor(readonly members: ReadonlyArray<KindParam>) {
    super()
  }
}

export class ObjectNode extends ast('Object') {
  constructor(readonly properties: readonly ObjectProperty[]) {
    super()
  }
}

export class ObjectProperty extends ast('ObjectProperty') {
  constructor(readonly name: string, readonly param: KindParam) {
    super()
  }
}

export class StaticNode extends ast('StaticNode') {
  constructor(readonly type: string) {
    super()
  }
}

export class TupleReturn extends ast('TupleReturn') {
  constructor(readonly members: ReadonlyArray<FunctionReturnSignature>) {
    super()
  }
}
