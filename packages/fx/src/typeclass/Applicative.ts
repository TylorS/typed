import type * as A from '@effect/data/typeclass/Applicative'

import type { Fx } from '../Fx.js'
import { combineAll } from '../operator/combine.js'

import { Of } from './Of.js'
import { SemiApplicative } from './SemiApplicative.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const Applicative: A.Applicative<FxTypeLambda> = {
  ...SemiApplicative,
  ...Of,
  productAll: (<R, E, A>(collection: Iterable<Fx<R, E, A>>) =>
    combineAll<readonly Fx<R, E, A>[]>(...collection)) as A.Applicative<FxTypeLambda>['productAll'],
}
