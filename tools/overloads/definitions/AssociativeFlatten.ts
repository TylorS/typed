import {
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  InterfaceProperty,
  Kind,
  KindReturn,
  StaticTypeParam,
} from '../AST'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt)
export const aTypeParam = new StaticTypeParam('A')

export const node = new Interface(
  'AssociativeFlatten',
  [hkt],
  [
    new InterfaceProperty(
      'flatten',
      new FunctionSignature(
        '',
        [placeholder, aTypeParam],
        [new Kind('kind', hkt, [placeholder, new Kind('', hkt, [placeholder, aTypeParam])])],
        new KindReturn(hkt, [placeholder, aTypeParam]),
      ),
    ),
  ],
)
