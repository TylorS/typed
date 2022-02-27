import {
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  InterfaceProperty,
  Kind,
  KindReturn,
  StaticNode,
  StaticTypeParam,
} from '../AST'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt)
export const aTypeParam = new StaticTypeParam('A')

export const node = new Interface(
  'Compact',
  [hkt],
  [
    new InterfaceProperty(
      'comapct',
      new FunctionSignature(
        '',
        [placeholder, aTypeParam],
        [new Kind('kind', hkt, [placeholder, new StaticNode(`Option<A>`)])],
        new KindReturn(hkt, [placeholder, aTypeParam]),
      ),
    ),
  ],
)
