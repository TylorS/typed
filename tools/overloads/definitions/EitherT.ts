import { HKTParam, HKTPlaceholder, KindReturn, StaticTypeParam, TypeAlias } from '../AST'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt)
export const aTypeParam = new StaticTypeParam('A')
export const bTypeParam = new StaticTypeParam('B')

export const node = new TypeAlias(
  'EitherT',
  [hkt, placeholder, aTypeParam, bTypeParam],
  new KindReturn(hkt, [placeholder, new StaticTypeParam(`Either<A, B>`)]),
)
