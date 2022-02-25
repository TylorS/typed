import {
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Kind,
  KindReturn,
  ObjectNode,
  ObjectProperty,
  StaticFunctionParam,
  StaticTypeParam,
  Typeclass,
} from '../AST'

export const hkt = new HKTParam('T')
export const nameTypeParam = new StaticTypeParam('N', 'string')
export const placeholder = new HKTPlaceholder(hkt)
export const aTypeParam = new StaticTypeParam('A')

export const node = new FunctionSignature(
  'bindTo',
  [hkt],
  [new Typeclass('C', 'Covariant', hkt)],
  new FunctionSignature(
    '',
    [nameTypeParam],
    [new StaticFunctionParam('name', nameTypeParam.type)],
    new FunctionSignature(
      '',
      [placeholder, aTypeParam],
      [new Kind('kind', hkt, [placeholder, aTypeParam])],
      new KindReturn(hkt, [
        placeholder,
        new ObjectNode([new ObjectProperty(`[K in N]`, new StaticTypeParam(`A`))]),
      ]),
    ),
  ),
)
