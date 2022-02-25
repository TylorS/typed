import {
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Kind,
  KindReturn,
  StaticTypeParam,
  Tuple,
  Typeclass,
} from '../AST'

export const hkt = new HKTParam('T')
export const aTypeParam = new StaticTypeParam('A')
export const bTypeParam = new StaticTypeParam('B')
export const placholder = new HKTPlaceholder(hkt)

export const node = new FunctionSignature(
  'tupled',
  [hkt],
  [new Typeclass('C', 'Covariant', hkt)],
  new FunctionSignature(
    '',
    [placholder, aTypeParam],
    [new Kind('kind', hkt, [placholder, aTypeParam])],
    new KindReturn(hkt, [placholder, new Tuple([aTypeParam])]),
  ),
)
