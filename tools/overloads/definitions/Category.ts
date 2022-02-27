import {
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  InterfaceProperty,
  KindReturn,
  StaticTypeParam,
} from '../AST'
import { node as AssociativeBoth } from './AssociativeBoth'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt, true)
export const aTypeParam = new StaticTypeParam('A')

export const node = new Interface(
  'Category',
  [hkt],
  [
    new InterfaceProperty(
      'id',
      new FunctionSignature(
        '',
        [aTypeParam, placeholder],
        [],
        new KindReturn(hkt, [placeholder, aTypeParam]),
      ),
    ),
  ],
  AssociativeBoth,
)
