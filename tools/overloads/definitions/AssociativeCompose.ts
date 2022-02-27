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
export const bTypeParam = new StaticTypeParam('B')
export const cTypeParam = new StaticTypeParam('C')

export const node = new Interface(
  'AssociativeCompose',
  [hkt],
  [
    new InterfaceProperty(
      'compose',
      new FunctionSignature(
        '',
        [placeholder, aTypeParam, bTypeParam],
        [new Kind('second', hkt, [placeholder, aTypeParam, bTypeParam])],
        new FunctionSignature(
          '',
          [cTypeParam],
          [new Kind('first', hkt, [placeholder, bTypeParam, cTypeParam])],
          new KindReturn(hkt, [placeholder, aTypeParam, cTypeParam]),
        ),
      ),
    ),
  ],
)
